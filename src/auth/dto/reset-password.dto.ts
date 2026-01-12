import { z } from 'zod';

export const ResetPasswordDto = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>;