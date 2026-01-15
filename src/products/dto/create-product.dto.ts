import { z } from 'zod';

export const CreateProductDto = z.object({
  merchantId: z.string().uuid('ID do comerciante inválido'),
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  price: z.number().positive('Preço deve ser positivo'),
  stockQuantity: z.number().int().min(0, 'Estoque não pode ser negativo'),
  images: z.array(z.string().url('URL de imagem inválida')).optional(),
  categoryId: z.string().uuid('Categoria inválida').optional(),
  isAvailable: z.boolean().default(true),
});

export type CreateProductDto = z.infer<typeof CreateProductDto>;