import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateCouponSchema = z.object({
  code: z.string().min(3).toUpperCase().trim().describe('Código do cupão (ex: BEMVINDO10)'),
  discountType: z.enum(['percentage', 'fixed']).describe('Tipo: percentagem ou valor fixo'),
  discountValue: z.coerce.number().positive().describe('Valor do desconto (ex: 10 para 10% ou 10€)'),
  minOrderValue: z.coerce.number().min(0).default(0).describe('Valor mínimo do pedido para aplicar'),
  validUntil: z.string().datetime({ offset: true }).optional().describe('Data de validade'),
  usageLimit: z.coerce.number().int().positive().optional().describe('Limite de utilizações (ex: apenas os 50 primeiros)'),
  isActive: z.boolean().default(true).describe('Se o cupão está ativo'),
});

export class CreateCouponDto extends createZodDto(CreateCouponSchema) {}