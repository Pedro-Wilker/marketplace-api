import { z } from 'zod';

export const CreateCategoryDto = z.object({
  name: z.string().min(3, 'Nome da categoria deve ter pelo menos 3 caracteres'),
  parentId: z.string().uuid('ID do pai inválido').optional(),
  type: z.enum(['product', 'service', 'public'], {
    message: 'Tipo deve ser product, service ou public',
  }),
});

export type CreateCategoryDto = z.infer<typeof CreateCategoryDto>;