import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PropertyBuildingService } from './services/property-building.service';
import { FloorRoomBedService } from './services/floor-room-bed.service';
import { FacilityService } from './services/facility.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [InventoryController],
  providers: [InventoryService, PropertyBuildingService, FloorRoomBedService, FacilityService],
  exports: [InventoryService],
})
export class InventoryModule {}
