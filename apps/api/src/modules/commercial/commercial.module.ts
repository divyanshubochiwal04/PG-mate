import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { CommercialController } from './commercial.controller';
import { CommercialService } from './commercial.service';

@Module({
  imports: [TenantModule],
  controllers: [CommercialController],
  providers: [CommercialService],
  exports: [CommercialService],
})
export class CommercialModule {}
