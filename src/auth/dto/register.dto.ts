import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(8, { message: 'Senha deve ter pelo menos 8 caracteres' }),
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  phone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  type: z.enum(['customer', 'merchant', 'professional'], {
    message: 'Tipo deve ser customer, merchant ou professional',
  }),
});

export type RegisterDto = z.infer<typeof RegisterDto>;