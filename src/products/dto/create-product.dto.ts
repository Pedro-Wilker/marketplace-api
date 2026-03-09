import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ProductOptionChoiceSchema = z.object({
  name: z.string().min(1, 'Nome da opção é obrigatório'),
  price: z.coerce.number().min(0).default(0), 
});

const ProductOptionGroupSchema = z.object({
  name: z.string().min(1, 'Nome do grupo (ex: Tamanho, Adicionais) é obrigatório'),
  isRequired: z.boolean().default(false), 
  maxChoices: z.number().int().min(1).optional(), 
  choices: z.array(ProductOptionChoiceSchema).min(1, 'Adicione pelo menos uma escolha'),
});

export const CreateProductSchema = z.object({
  merchantId: z.string().uuid('ID do comerciante inválido').optional(), 
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Preço deve ser positivo'),
  stockQuantity: z.coerce.number().int().min(0, 'Estoque não pode ser negativo').default(0),
  images: z.array(z.string().url('URL de imagem inválida')).optional(),
  categoryId: z.string().uuid('Categoria inválida').optional(),
  isAvailable: z.boolean().default(true),
  
  options: z.array(ProductOptionGroupSchema).optional().describe('Complementos e opções do produto'),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}