import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const FormFieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const ServiceFormFieldSchema = z.object({
  label: z.string().min(2, 'O rótulo deve ter no mínimo 2 caracteres').describe('Pergunta. Ex: Tamanho da Casa'),
  type: z.enum(['text', 'number', 'select', 'boolean', 'date']).describe('Tipo de dado esperado'),
  isRequired: z.boolean().default(true).describe('O cliente é obrigado a preencher?'),
  options: z.array(FormFieldOptionSchema).optional().describe('Opções se o tipo for select'),
  orderIndex: z.number().int().default(0).describe('Ordem em que aparece na tela'),
});

const CreateServiceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').describe('Nome do serviço'),
  description: z.string().optional().describe('Descrição detalhada'),
  priceType: z.enum(['fixed', 'hourly', 'negotiable']).describe('Tipo de cobrança'),
  price: z.coerce.number().positive().optional().describe('Preço (se aplicável)'),
  estimatedDuration: z.coerce.number().int().positive().optional().describe('Duração estimada em minutos'),
  categoryId: z.string().uuid().optional().describe('ID da categoria'),
  imageUrl: z.string().optional().describe('URL da imagem de capa (Cloudinary)'),
  
  requiresCustomForm: z.boolean().default(false).describe('Requer que o cliente preencha informações extras?'),
  formFields: z.array(ServiceFormFieldSchema).optional().describe('Perguntas dinâmicas para o cliente'),
});

export class CreateServiceDto extends createZodDto(CreateServiceSchema) { }