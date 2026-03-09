import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ValidateCouponSchema = z.object({
  code: z.string().toUpperCase().trim().describe('Código inserido pelo cliente'),
  merchantId: z.string().uuid().describe('ID da loja onde o cliente está a comprar'),
  orderTotal: z.coerce.number().positive().describe('Valor total atual do carrinho'),
});

export class ValidateCouponDto extends createZodDto(ValidateCouponSchema) {}