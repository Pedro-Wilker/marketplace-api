import { z } from 'zod';
import { createZodDto } from 'nestjs-zod'; 

const LoginSchema = z.object({
  email: z.string().email().describe('E-mail do usuário'),
  password: z.string().min(8).describe('Senha de acesso'),
});

export class LoginDto extends createZodDto(LoginSchema) {}