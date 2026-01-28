import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const BecomePrefectureSchema = z.object({
  officialName: z.string().min(5).describe('Razão Social da Prefeitura'),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido').describe('CNPJ'),
  addressStreet: z.string().min(5).describe('Rua'),
  addressNumber: z.string().optional().describe('Número'),
  addressNeighborhood: z.string().min(3).describe('Bairro'),
  addressCity: z.string().min(3).describe('Cidade'),
  addressState: z.string().length(2, 'Use sigla de 2 letras').describe('UF'),
  addressZipCode: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido').describe('CEP'),
  location: z.string().optional().describe('Coordenadas ou referência'),
  officialWebsite: z.string().url().optional().describe('Site oficial'),
  mainPhone: z.string().optional().describe('Telefone principal'),
  institutionalEmail: z.string().email().optional().describe('E-mail institucional'),
  responsibleName: z.string().min(3).optional().describe('Nome do responsável'),
  responsiblePosition: z.string().optional().describe('Cargo do responsável'),
});

export class BecomePrefectureDto extends createZodDto(BecomePrefectureSchema) {}