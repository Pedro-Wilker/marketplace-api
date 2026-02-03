import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  serviceId: z.string().uuid(),
  requestId: z.string().uuid().optional(), 
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export class CreateReviewDto extends createZodDto(CreateReviewSchema) {}