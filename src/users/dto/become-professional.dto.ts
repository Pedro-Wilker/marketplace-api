import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const BecomeProfessionalSchema = z.object({
  categories: z.array(z.string()).min(1, 'Selecione pelo menos uma categoria').describe('Lista de categorias'),
  serviceRadiusKm: z.coerce.number().int().min(1).max(200).optional().describe('Raio de atendimento em KM'),
  portfolio: z.array(z.string().url()).optional().describe('URLs de portfólio externo'),
});

export class BecomeProfessionalDto extends createZodDto(BecomeProfessionalSchema) {}