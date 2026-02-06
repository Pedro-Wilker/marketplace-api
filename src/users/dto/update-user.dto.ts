import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  
  avatar: z.string().optional().describe('URL da foto de perfil'),
  bio: z.string().max(500).optional().describe('Biografia ou descrição curta'),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}