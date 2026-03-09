import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { DrizzleModule } from './db/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';

import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ServicesModule } from './services/services.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { ReviewsModule } from './reviews/reviews.module';

import { OrdersModule } from './orders/orders.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { CitizenReportsModule } from './citizen-reports/citizen-reports.module';
import { CouponsModule } from './coupons/coupons.module';
import { FavoritesModule } from './favorites/favorites.module';

import { ProductOwnershipGuard } from './auth/guards/ownership.guard';
import { RolesGuard } from './auth/guards/roles.guard';

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
    AuthModule,
    UploadModule,
    NotificationsModule,
    ChatModule,
    
    UsersModule,
    CategoriesModule,
    ProductsModule,
    ServicesModule,
    ServiceRequestsModule,
    ReviewsModule,
    
    OrdersModule,
    AnnouncementsModule,
    CitizenReportsModule,
    CouponsModule,
    FavoritesModule,
  ],
  providers: [
    ProductOwnershipGuard,
    RolesGuard,
  ],
})
export class AppModule { }