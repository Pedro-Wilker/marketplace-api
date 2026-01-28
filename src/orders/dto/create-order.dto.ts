import { z } from 'zod';

export const OrderItemDto = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const CreateOrderDto = z.object({
  merchantId: z.string().uuid(), 
  items: z.array(OrderItemDto).min(1, 'O pedido deve ter pelo menos um item'),
  deliveryAddressId: z.string().uuid().optional(),
  paymentMethod: z.enum(['credit_card', 'pix', 'cash']),
  notes: z.string().max(500).optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDto>;