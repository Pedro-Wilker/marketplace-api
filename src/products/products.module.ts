import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { DrizzleModule } from '../db/drizzle.module';
import { UploadModule } from '../upload/upload.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    DrizzleModule,
    UploadModule,
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 }, 
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}