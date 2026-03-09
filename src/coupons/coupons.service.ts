import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { coupons } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(merchantId: string, data: CreateCouponDto) {
    // Verifica se o código já existe (O código deve ser único globalmente ou por loja)
    const [existing] = await this.db.select().from(coupons).where(eq(coupons.code, data.code)).limit(1);
    if (existing) {
      throw new BadRequestException('Este código de cupão já existe. Escolha outro.');
    }

    const [coupon] = await this.db
      .insert(coupons)
      .values({
        code: data.code,
        merchantId, 
        discountType: data.discountType,
        discountValue: data.discountValue.toString(),
        minOrderValue: data.minOrderValue?.toString(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        usageLimit: data.usageLimit,
        isActive: data.isActive,
      })
      .returning();

    return coupon;
  }

  async findAllByMerchant(merchantId: string) {
    return await this.db.query.coupons.findMany({
      where: eq(coupons.merchantId, merchantId),
      orderBy: [desc(coupons.createdAt)],
    });
  }

  async toggleStatus(merchantId: string, couponId: string) {
    const [coupon] = await this.db.select().from(coupons).where(eq(coupons.id, couponId)).limit(1);
    
    if (!coupon) throw new NotFoundException('Cupão não encontrado');
    if (coupon.merchantId !== merchantId) throw new ForbiddenException('Acesso negado');

    const [updated] = await this.db
      .update(coupons)
      .set({ isActive: !coupon.isActive })
      .where(eq(coupons.id, couponId))
      .returning();

    return updated;
  }

  async remove(merchantId: string, couponId: string) {
    const [coupon] = await this.db.select().from(coupons).where(eq(coupons.id, couponId)).limit(1);
    
    if (!coupon) throw new NotFoundException('Cupão não encontrado');
    if (coupon.merchantId !== merchantId) throw new ForbiddenException('Acesso negado');

    await this.db.delete(coupons).where(eq(coupons.id, couponId));
    return { message: 'Cupão removido' };
  }

  // =======================================================
  // LÓGICA CRÍTICA: VALIDAÇÃO NO CARRINHO
  // =======================================================
  async validate(data: ValidateCouponDto) {
    const [coupon] = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.code, data.code))
      .limit(1);

    if (!coupon) throw new BadRequestException('Cupão inválido ou não existe.');

    // 1. Verificar se está ativo
    if (!coupon.isActive) throw new BadRequestException('Este cupão foi desativado.');

    // 2. Verificar a Loja (Se merchantId for nulo, é um cupão global do App. Se tiver, tem de bater certo)
    if (coupon.merchantId && coupon.merchantId !== data.merchantId) {
      throw new BadRequestException('Este cupão não é válido para esta loja.');
    }

    // 3. Verificar validade (Data)
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      throw new BadRequestException('Este cupão já expirou.');
    }

    // 4. Verificar limite de utilizações
    if (coupon.usageLimit && (coupon.usedCount ?? 0) >= coupon.usageLimit) {
      throw new BadRequestException('Este cupão atingiu o limite de utilizações.');
    }

    // 5. Verificar valor mínimo
    const minOrder = Number(coupon.minOrderValue || 0);
    if (data.orderTotal < minOrder) {
      throw new BadRequestException(`O valor mínimo para utilizar este cupão é de R$ ${minOrder.toFixed(2)}.`);
    }

    // 6. Calcular o desconto para devolver ao Frontend
    let discountAmount = 0;
    const discountValue = Number(coupon.discountValue);

    if (coupon.discountType === 'percentage') {
      discountAmount = data.orderTotal * (discountValue / 100);
    } else {
      discountAmount = discountValue;
    }

    // Impede que o desconto seja maior que o total do pedido
    if (discountAmount > data.orderTotal) {
      discountAmount = data.orderTotal;
    }

    return {
      isValid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountAmount: Number(discountAmount.toFixed(2)),
      finalTotal: Number((data.orderTotal - discountAmount).toFixed(2))
    };
  }
}