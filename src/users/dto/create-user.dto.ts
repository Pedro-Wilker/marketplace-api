import { z } from 'zod';

export const CreateUserDto = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8), 
  phone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  type: z.enum(['customer', 'merchant', 'professional', 'admin']),
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;