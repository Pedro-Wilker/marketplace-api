import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateAnnouncementSchema = z.object({
  targetCity: z.string().min(2, 'A cidade alvo é obrigatória').describe('Cidade que verá este anúncio'),
  title: z.string().min(5, 'O título deve ter no mínimo 5 caracteres').describe('Título da postagem'),
  content: z.string().min(10, 'O conteúdo deve ser mais detalhado').describe('Texto completo do anúncio'),
  type: z.enum(['news', 'event', 'alert', 'inauguration']).describe('Tipo de postagem'),
  
  imageUrl: z.string().url().optional().describe('Imagem de capa (Upload prévio)'),
  actionLink: z.string().url().optional().describe('Link para botão "Saiba mais" (Opcional)'),
  
  expiresAt: z.string().datetime({ offset: true }).optional().describe('Data de expiração (Formato ISO 8601)'),
});

export class CreateAnnouncementDto extends createZodDto(CreateAnnouncementSchema) {}

const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial().extend({
  isActive: z.boolean().optional().describe('Para pausar/ativar o anúncio manualmente')
});

export class UpdateAnnouncementDto extends createZodDto(UpdateAnnouncementSchema) {}