import { z } from 'zod';

export const CreateServiceDto = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  priceType: z.enum(['fixed', 'hourly', 'negotiable']),
  price: z.coerce.number().positive().optional(), 
  estimatedDuration: z.coerce.number().int().positive().optional(), 
  categoryId: z.string().uuid().optional(),
});

export type CreateServiceDto = z.infer<typeof CreateServiceDto>;