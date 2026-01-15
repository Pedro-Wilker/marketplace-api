import { CreateProductDto } from './create-product.dto';
import { z } from 'zod';

export const UpdateProductDto = CreateProductDto.partial(); 
export type UpdateProductDto = z.infer<typeof UpdateProductDto>;