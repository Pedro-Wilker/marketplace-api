import { z } from 'zod';

export const BecomeProfessionalDto = z.object({
  categories: z.array(z.string()).min(1, 'Selecione pelo menos uma categoria'),
  serviceRadiusKm: z.number().int().min(1).max(200).optional(),
  portfolio: z.array(z.string().url()).optional(), 
});

export type BecomeProfessionalDto = z.infer<typeof BecomeProfessionalDto>;