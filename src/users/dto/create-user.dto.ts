import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email().describe('E-mail'),
  name: z.string().min(2).describe('Nome completo'),
  password: z.string().min(8).describe('Senha'),
  phone: z.string().optional().describe('Telefone'),
  cpfCnpj: z.string().optional().describe('CPF ou CNPJ'),
  type: z.enum(['customer', 'merchant', 'professional', 'admin', 'prefecture']).describe('Tipo de conta'), // Adicionei prefecture aqui caso precise
  
  // 👇 ADICIONE ISTO:
  avatar: z.string().optional().describe('URL da foto de perfil'),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}