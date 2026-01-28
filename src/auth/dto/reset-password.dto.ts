import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ResetPasswordSchema = z.object({
  token: z.string().describe('Token recebido por e-mail'),
  newPassword: z.string().min(8).describe('Nova senha'),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}