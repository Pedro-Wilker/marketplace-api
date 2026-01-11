import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './db/drizzle.module';
import { UsersModule } from './users/users.module';
import { ChatGateway } from './gateways/chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    DrizzleModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
  ],
  providers: [ChatGateway],
})
export class AppModule { }