import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { DrizzleModule } from '../db/drizzle.module'; 

@Module({
  imports: [DrizzleModule],  
  controllers: [UsersController],
  providers: [],  
})
export class UsersModule {}