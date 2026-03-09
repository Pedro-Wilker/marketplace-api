import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ToggleFavoriteSchema = z.object({
  type: z.enum(['merchant', 'professional', 'service', 'product']).describe('O que está sendo favoritado?'),
  targetId: z.string().uuid().describe('O ID do item que está sendo favoritado (id da loja, produto, etc.)'),
});

export class ToggleFavoriteDto extends createZodDto(ToggleFavoriteSchema) {}