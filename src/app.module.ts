import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from './db/drizzle.module';
import { UsersModule } from './users/users.module';
import { ChatGateway } from './gateways/chat.gateway';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    DrizzleModule,
    UsersModule,
  ],
  providers: [ChatGateway],
})
export class AppModule { }