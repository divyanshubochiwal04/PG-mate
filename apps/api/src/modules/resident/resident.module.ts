import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { ResidentController } from './controllers/resident.controller';
import { AllocationController } from './controllers/allocation.controller';
import { ResidentService } from './services/resident.service';
import { EmergencyContactService } from './services/emergency-contact.service';
import { StayAllocationService } from './services/stay-allocation.service';

@Module({
  imports: [TenantModule],
  controllers: [ResidentController, AllocationController],
  providers: [ResidentService, EmergencyContactService, StayAllocationService],
  exports: [ResidentService, EmergencyContactService, StayAllocationService],
})
export class ResidentModule {}
