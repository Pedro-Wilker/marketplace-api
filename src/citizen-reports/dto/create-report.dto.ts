import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateReportSchema = z.object({
  prefectureId: z.string().uuid().describe('ID da prefeitura responsável (usuário tipo prefecture)'),
  category: z.string().min(3, 'A categoria é obrigatória').describe('Ex: Asfalto, Iluminação, Lixo, Saúde'),
  description: z.string().min(10, 'Descreva o problema com mais detalhes').describe('Descrição do problema'),
  
  imageUrl: z.string().url().optional().describe('Foto do problema (Upload prévio)'),
  
  lat: z.coerce.number().optional().describe('Latitude'),
  lng: z.coerce.number().optional().describe('Longitude'),
  addressReference: z.string().optional().describe('Ponto de referência ou endereço digitado'),
});

export class CreateReportDto extends createZodDto(CreateReportSchema) {}

export const UpdateReportStatusSchema = z.object({
  status: z.enum(['reported', 'in_progress', 'resolved', 'dismissed']).describe('Novo status do chamado'),
  adminNotes: z.string().optional().describe('Mensagem de retorno da prefeitura para o cidadão'),
});

export class UpdateReportStatusDto extends createZodDto(UpdateReportStatusSchema) {}