import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const OrderItemSchema = z.object({
  productId: z.string().uuid().describe('ID do produto'),
  quantity: z.number().int().positive().describe('Quantidade'),
  
  selectedOptions: z.record(z.string(), z.any()).optional().describe('Opções e complementos escolhidos'),
});

const CreateOrderSchema = z.object({
  merchantId: z.string().uuid().describe('ID da loja/comerciante'),
  items: z.array(OrderItemSchema).min(1, 'O pedido deve ter pelo menos um item'),
  deliveryAddressId: z.string().uuid().optional().describe('ID do endereço de entrega'),
  paymentMethod: z.enum(['credit_card', 'pix', 'cash']).describe('Método de pagamento'),
  notes: z.string().max(500).optional().describe('Observações do pedido'),
  
  couponId: z.string().uuid().optional().describe('ID do cupom de desconto aplicado'),
  deliveryFee: z.coerce.number().min(0).optional().describe('Taxa de entrega acordada'),
});

export class OrderItemDto extends createZodDto(OrderItemSchema) {}
export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}