import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateRequestSchema = z.object({
  serviceId: z.string().uuid(),
  customerNote: z.string().optional().describe('Observação extra do cliente'),
  
  // NOVO: Respostas do formulário dinâmico
  customAnswers: z.record(z.string(), z.any()).optional().describe('Objeto JSON com as respostas do formulário dinâmico'),
  
  // NOVO: Agendamento do serviço
  scheduledDate: z.string().datetime({ offset: true }).optional().describe('Data e hora agendada (Formato ISO 8601)'),
});

export class CreateRequestDto extends createZodDto(CreateRequestSchema) {}