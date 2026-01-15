import { z } from 'zod';

export const BecomePrefectureDto = z.object({
  officialName: z.string().min(5),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
  addressStreet: z.string().min(5),
  addressNumber: z.string().optional(),
  addressNeighborhood: z.string().min(3),
  addressCity: z.string().min(3),
  addressState: z.string().length(2, 'Use sigla de 2 letras'),
  addressZipCode: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
  location: z.string().optional(), 
  officialWebsite: z.string().url().optional(),
  mainPhone: z.string().optional(),
  institutionalEmail: z.string().email().optional(),
  responsibleName: z.string().min(3).optional(),
  responsiblePosition: z.string().optional(),
});

export type BecomePrefectureDto = z.infer<typeof BecomePrefectureDto>;