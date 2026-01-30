import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdatePrefectureSchema = z.object({
  officialName: z.string().min(5).optional(),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido').optional(),
  addressStreet: z.string().min(5).optional(),
  addressNumber: z.string().optional(),
  addressNeighborhood: z.string().min(3).optional(),
  addressCity: z.string().min(3).optional(),
  addressState: z.string().length(2).optional(),
  addressZipCode: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido').optional(),
  location: z.string().optional(),
  officialWebsite: z.string().url().optional(),
  mainPhone: z.string().optional(),
  institutionalEmail: z.string().email().optional(),
  responsibleName: z.string().min(3).optional(),
  responsiblePosition: z.string().optional(),
});

export class UpdatePrefectureDto extends createZodDto(UpdatePrefectureSchema) {}