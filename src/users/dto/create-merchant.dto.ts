import { z } from 'zod';

export const CreateMerchantDto = z.object({
  businessName: z.string().min(3),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido').optional(),
  categoryId: z.string().uuid(),
  openingHours: z.record(z.string(), z.string()).optional(),
  minimumOrder: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
});

export type CreateMerchantDto = z.infer<typeof CreateMerchantDto>;