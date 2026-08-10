import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantContextService } from './services/tenant-context.service';
import { TenantAuthorizationGuard } from './guards/tenant-authorization.guard';

@Module({
  controllers: [TenantController],
  providers: [TenantContextService, TenantAuthorizationGuard],
  exports: [TenantContextService, TenantAuthorizationGuard],
})
export class TenantModule {}
