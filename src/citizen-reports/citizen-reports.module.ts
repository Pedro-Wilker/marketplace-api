import { Module } from '@nestjs/common';
import { CitizenReportsService } from './citizen-reports.service';
import { CitizenReportsController } from './citizen-reports.controller';
import { DrizzleModule } from '../db/drizzle.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    DrizzleModule,
    NotificationsModule,
  ],
  controllers: [CitizenReportsController],
  providers: [CitizenReportsService],
  exports: [CitizenReportsService],
})
export class CitizenReportsModule {}