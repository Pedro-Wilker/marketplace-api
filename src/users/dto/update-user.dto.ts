import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}