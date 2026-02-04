import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateServiceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').describe('Nome do serviço'),
  description: z.string().optional().describe('Descrição detalhada'),
  priceType: z.enum(['fixed', 'hourly', 'negotiable']).describe('Tipo de cobrança'),
  price: z.coerce.number().positive().optional().describe('Preço (se aplicável)'),
  estimatedDuration: z.coerce.number().int().positive().optional().describe('Duração estimada em minutos'),
  categoryId: z.string().uuid().optional().describe('ID da categoria'),
  
  // 👇 ADICIONE ISTO AQUI:
  imageUrl: z.string().optional().describe('URL da imagem de capa (Cloudinary)'),
});

export class CreateServiceDto extends createZodDto(CreateServiceSchema) { }