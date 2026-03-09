import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  rating: z.number().min(1, 'Nota mínima é 1').max(5, 'Nota máxima é 5'),
  comment: z.string().optional(),
  
  serviceId: z.string().uuid().optional(),
  merchantId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  
  requestId: z.string().uuid().optional().describe('Para comprovar uso de serviço'),
  orderId: z.string().uuid().optional().describe('Para comprovar compra (e-commerce/logística)'),
}).refine(
  (data) => data.serviceId || data.merchantId || data.driverId || data.productId,
  { message: 'Você precisa informar o que está avaliando (Serviço, Loja, Entregador ou Produto).' }
);

export class CreateReviewDto extends createZodDto(CreateReviewSchema) {}