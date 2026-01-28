import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }).describe('E-mail do usuário'),
  password: z.string().min(8, { message: 'Senha deve ter pelo menos 8 caracteres' }).describe('Senha de acesso'),
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }).describe('Nome completo'),
  phone: z.string().optional().describe('Telefone de contato'),
  cpfCnpj: z.string().optional().describe('CPF ou CNPJ'),
  type: z.enum(['customer', 'merchant', 'professional'], {
    message: 'Tipo deve ser customer, merchant ou professional',
  }).describe('Tipo de conta'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}