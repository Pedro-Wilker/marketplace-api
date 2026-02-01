import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const SendMessageSchema = z.object({
  requestId: z.string().uuid(),
  content: z.string().min(1),
});

export class SendMessageDto extends createZodDto(SendMessageSchema) {}