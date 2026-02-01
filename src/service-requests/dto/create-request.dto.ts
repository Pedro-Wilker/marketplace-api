import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateRequestSchema = z.object({
  serviceId: z.string().uuid(),
  customerNote: z.string().optional(),
});

export class CreateRequestDto extends createZodDto(CreateRequestSchema) {}