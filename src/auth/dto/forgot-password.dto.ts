import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ForgotPasswordSchema = z.object({
  email: z.string().email().describe('E-mail para recuperação'),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}