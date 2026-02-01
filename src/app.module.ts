import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DrizzleModule } from './db/drizzle.module';
import { UsersModule } from './users/users.module';

import { JwtModule } from '@nestjs/jwt';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { ProductOwnershipGuard } from './auth/guards/ownership.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { UploadModule } from './upload/upload.module';
import { ServicesModule } from './services/services.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    DrizzleModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    AuthModule,
    UploadModule,
    ServicesModule,
    ChatModule
  ],
  providers: [
    ProductOwnershipGuard,
    RolesGuard,
  ],
})
export class AppModule { }