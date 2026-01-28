import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8).describe('Senha atual'),
  newPassword: z.string().min(8).describe('Nova senha'),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}