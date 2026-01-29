import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateMerchantSchema = z.object({
  businessName: z.string().min(3).describe('Nome Fantasia'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido').optional().describe('CNPJ (opcional para MEI)'),
  categoryId: z.string().uuid().describe('Categoria principal'),
  openingHours: z.record(z.string(), z.string()).optional().describe('Horário de funcionamento (JSON)'),
  minimumOrder: z.coerce.number().min(0).optional().describe('Pedido mínimo'),
  deliveryFee: z.coerce.number().min(0).optional().describe('Taxa de entrega fixa'),
  
  location: z.string().optional().describe('Coordenadas ou Endereço'),
});

export class CreateMerchantDto extends createZodDto(CreateMerchantSchema) {}