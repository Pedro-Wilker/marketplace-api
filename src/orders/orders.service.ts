import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { orders, orderItems, products } from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(@Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>) {}

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

    let totalAmount = 0;
    
    const itemsToInsert: { productId: string; quantity: number; priceUnit: string }[] = [];

    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      

      if (!product) {
        throw new BadRequestException(`Produto ${item.productId} não encontrado no mapa.`);
      }
      
      if (!product.isAvailable || (product.stockQuantity || 0) < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para o produto: ${product.name}`);
      }

      const price = Number(product.price);
      totalAmount += price * item.quantity;

      itemsToInsert.push({
        productId: item.productId,
        quantity: item.quantity,
        priceUnit: product.price.toString(),
      });
    }

    return await this.db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          customerId,
          merchantId: data.merchantId,
          total: totalAmount.toFixed(2),
          status: 'pending',
          paymentMethod: data.paymentMethod,
          deliveryAddressId: data.deliveryAddressId,
          notes: data.notes,
        })
        .returning();

      await tx.insert(orderItems).values(
        itemsToInsert.map(item => ({
          orderId: newOrder.id,
          ...item
        }))
      );

      for (const item of itemsToInsert) {
        await tx
          .update(products)
          .set({ 
            stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` 
          })
          .where(eq(products.id, item.productId));
      }

      return newOrder;
    });
  }

  async findAllByUser(userId: string, type: 'customer' | 'merchant') {
    const field = type === 'customer' ? orders.customerId : orders.merchantId;
    
    return await this.db
      .select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        merchantName: schema.merchantProfiles.businessName,
      })
      .from(orders)
      .leftJoin(schema.merchantProfiles, eq(orders.merchantId, schema.merchantProfiles.userId))
      .where(eq(field, userId))
      .orderBy(sql`${orders.createdAt} DESC`);
  }
}