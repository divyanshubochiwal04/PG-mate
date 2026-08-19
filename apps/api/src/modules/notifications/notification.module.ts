import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationDetectorService } from './notification-detector.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationDetectorService],
  exports: [NotificationService, NotificationDetectorService],
})
export class NotificationModule {}
