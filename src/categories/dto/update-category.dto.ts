import { CreateCategoryDto } from "./create-category.dto";
import { z } from 'zod';

export const UpdateCategoryDto = CreateCategoryDto.partial();
export type UpdateCategoryDto = z.infer<typeof UpdateCategoryDto>;