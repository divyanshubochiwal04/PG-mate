import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { CommercialModule } from './modules/commercial/commercial.module';
import { HealthModule } from './modules/health/health.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MessModule } from './modules/mess/mess.module';
import { ResidentModule } from './modules/resident/resident.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { RequestContextMiddleware } from './common/context/request-context.middleware';

import { ReportingModule } from './modules/reporting/reporting.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { TaskModule } from './modules/tasks/task.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
    AuthModule,
    TenantModule,
    InventoryModule,
    ResidentModule,
    CommercialModule,
    MessModule,
    BillingModule,
    ReportingModule,
    NotificationModule,
    TaskModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
