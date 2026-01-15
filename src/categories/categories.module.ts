  import { Module } from '@nestjs/common';
  import { CategoriesService } from './categories.service';
  import { CategoriesController } from './categories.controller';
  import { DrizzleModule } from '../db/drizzle.module';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [DrizzleModule, ProductsModule], 
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}