import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { DrizzleModule } from '../db/drizzle.module'; 
import { UploadModule } from '../upload/upload.module'; 

@Module({
  imports: [DrizzleModule, UploadModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}