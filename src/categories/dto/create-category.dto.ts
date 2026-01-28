import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(3, 'Nome da categoria deve ter pelo menos 3 caracteres').describe('Nome da categoria'),
  parentId: z.string().uuid('ID do pai inválido').optional().describe('ID da categoria pai (opcional)'),
  type: z.enum(['product', 'service', 'public'], {
    message: 'Tipo deve ser product, service ou public',
  }).describe('Tipo da categoria'),
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}