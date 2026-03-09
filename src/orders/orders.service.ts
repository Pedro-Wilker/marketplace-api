import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { orders, orderItems, products, coupons } from '../db/schema';
import { eq, inArray, sql, desc } from 'drizzle-orm';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(customerId: string, data: CreateOrderDto) {
    const productIds = data.items.map(i => i.productId);
    
    const dbProducts = await this.db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    if (dbProducts.length !== productIds.length) {
      throw new BadRequestException('Alguns produtos não foram encontrados ou estão indisponíveis.');
    }

    const isSingleMerchant = dbProducts.every(p => p.merchantId === data.merchantId);
    if (!isSingleMerchant) {
      throw new BadRequestException('Todos os itens do pedido devem pertencer ao mesmo estabelecimento.');
    }

    let itemsTotal = 0;
    const itemsToInsert: { productId: string; quantity: number; priceUnit: string; selectedOptions: any }[] = [];
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    // 1. Calcular o total dos produtos
    for (const item of data.items) {
      const product = productMap.get(item.productId);
      
      if (!product) throw new BadRequestException(`Produto ${item.productId} não encontrado.`);
      if (!product.isAvailable || (product.stockQuantity || 0) < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para o produto: ${product.name}`);
      }

      // Opcional: Aqui você poderia somar o preço das 'selectedOptions' se elas tiverem custo extra.
      const price = Number(product.price);
      itemsTotal += price * item.quantity;

      itemsToInsert.push({
        productId: item.productId,
        quantity: item.quantity,
        priceUnit: product.price.toString(),
        selectedOptions: item.selectedOptions || null, // NOVO: Salva os complementos
      });
    }

    // 2. Aplicar Cupons (Se houver)
    let discountAmount = 0;
    if (data.couponId) {
       const [coupon] = await this.db.select().from(coupons).where(eq(coupons.id, data.couponId)).limit(1);
       if (!coupon || !coupon.isActive) throw new BadRequestException('Cupom inválido ou expirado.');
       
       if (coupon.discountType === 'percentage') {
         discountAmount = itemsTotal * (Number(coupon.discountValue) / 100);
       } else {
         discountAmount = Number(coupon.discountValue);
       }
    }

    // 3. Fechamento da Conta
    const deliveryFee = data.deliveryFee || 0;
    const finalTotal = (itemsTotal - discountAmount) + deliveryFee;

    // Regra de Negócio de Repasse (Exemplo: App fica com 10% do valor dos produtos, Motorista fica com 100% do frete)
    const platformFee = itemsTotal * 0.10;
    const driverFee = deliveryFee; 

    return await this.db.transaction(async (tx) => {
      // Cria a Cabeça do Pedido
      const [newOrder] = await tx
        .insert(orders)
        .values({
          customerId,
          merchantId: data.merchantId,
          
          total: finalTotal.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          platformFee: platformFee.toFixed(2),
          driverFee: driverFee.toFixed(2),
          
          couponId: data.couponId || null,
          discountAmount: discountAmount.toFixed(2),
          
          status: 'pending',
          paymentMethod: data.paymentMethod,
          deliveryAddressId: data.deliveryAddressId,
          notes: data.notes,
        })
        .returning();

      // Salva os itens do pedido
      await tx.insert(orderItems).values(
        itemsToInsert.map(item => ({
          orderId: newOrder.id,
          ...item
        }))
      );

      // Desconta do estoque
      for (const item of itemsToInsert) {
        await tx
          .update(products)
          .set({ 
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` 
          })
          .where(eq(products.id, item.productId));
      }

      // Notifica a Loja
      await this.notificationsService.create(
        data.merchantId,
        'request_new',
        'Novo Pedido Recebido! 🍔',
        `Você tem um novo pedido de R$ ${finalTotal.toFixed(2)}.`,
        '/dashboard/pedidos'
      );

      return newOrder;
    });
  }

  async findAllByUser(userId: string, type: 'customer' | 'merchant') {
    const field = type === 'customer' ? orders.customerId : orders.merchantId;
    
    // Agora retornamos com with() para trazer os itens e complementos
    return await this.db.query.orders.findMany({
      where: eq(field, userId),
      orderBy: [desc(orders.createdAt)],
      with: {
        items: true, // Puxa o detalhe da compra
      }
    });
  }

  async updateStatus(orderId: string, status: any) {
    const [updated] = await this.db
      .update(orders)
      .set({ 
         status,
         updatedAt: new Date(),
         deliveredAt: status === 'delivered' ? new Date() : null,
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updated) throw new NotFoundException('Pedido não encontrado');

    // Avisa o cliente
    await this.notificationsService.create(
      updated.customerId,
      'request_update',
      status === 'on_the_way' ? 'Seu pedido está a caminho! 🛵' : `Status do Pedido Atualizado`,
      `O status do seu pedido mudou para: ${status}`,
      '/pedidos'
    );

    return updated;
  }
}