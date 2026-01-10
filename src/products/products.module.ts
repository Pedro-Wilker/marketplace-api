import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DrizzleModule } from '../db/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], 
})
export class ProductsModule {}