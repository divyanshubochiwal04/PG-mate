import { Injectable } from '@nestjs/common';
import { dbService } from '@m-square/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
import type {
  BedDto,
  BuildingDto,
  BuildingOccupancyTreeDto,
  BuildingSetupResultDto,
  FacilityDto,
  FloorDto,
  OperationalConfigurationSummaryDto,
  PropertyDto,
  RoomDto,
} from '@m-square/contracts';
import { PropertyBuildingService } from './services/property-building.service';
import { FloorRoomBedService } from './services/floor-room-bed.service';
import { FacilityService } from './services/facility.service';
import { BuildingSetupService } from './services/building-setup.service';
import type { CreatePropertyDto } from './dto/create-property.dto';
import type { UpdatePropertyDto } from './dto/update-property.dto';
import type { CreateBuildingDto } from './dto/create-building.dto';
import type { UpdateBuildingDto } from './dto/update-building.dto';
import type { CreateFloorDto } from './dto/create-floor.dto';
import type { UpdateFloorDto } from './dto/update-floor.dto';
import type { CreateRoomDto } from './dto/create-room.dto';
import type { UpdateRoomDto } from './dto/update-room.dto';
import type { UpdateCapacityDto } from './dto/update-capacity.dto';
import type { CreateBedDto } from './dto/create-bed.dto';
import type { UpdateBedDto } from './dto/update-bed.dto';
import type { UpdateBedStatusDto } from './dto/update-bed-status.dto';
import type { CreateFacilityDto } from './dto/create-facility.dto';
import type { CreateBuildingSetupDto } from './dto/create-building-setup.dto';

@Injectable()
export class InventoryService {
  private readonly db = dbService.db;

  constructor(
    private readonly propertyBuildingService: PropertyBuildingService,
    private readonly floorRoomBedService: FloorRoomBedService,
    private readonly facilityService: FacilityService,
    private readonly buildingSetupService: BuildingSetupService
  ) {}

  public async getOperationalConfigurationSummary(
    organizationId: string
  ): Promise<OperationalConfigurationSummaryDto> {
    const props = await this.getProperties(organizationId, { page: 1, pageSize: 100 });
    const bldgCount = await this.db
      .selectFrom('buildings')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();
    const flrCount = await this.db
      .selectFrom('floors')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();
    const rmCount = await this.db
      .selectFrom('rooms')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();
    const bdCount = await this.db
      .selectFrom('beds')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    const messCount = await this.db
      .selectFrom('messes')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();
    const planCount = await this.db
      .selectFrom('mess_meal_plans')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();
    const subCount = await this.db
      .selectFrom('resident_mess_subscriptions')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirstOrThrow();

    return {
      properties: props.items,
      buildingsCount: parseInt(bldgCount.cnt, 10),
      floorsCount: parseInt(flrCount.cnt, 10),
      roomsCount: parseInt(rmCount.cnt, 10),
      bedsCount: parseInt(bdCount.cnt, 10),
      messOverview: {
        totalMesses: parseInt(messCount.cnt, 10),
        activeMealPlans: parseInt(planCount.cnt, 10),
        activeSubscribers: parseInt(subCount.cnt, 10),
      },
      billingDefaults: {
        defaultBillingCycle: 'MONTHLY',
        invoiceDueDays: 10,
        gracePeriodDays: 3,
        lateFeeEnabled: false,
      },
      inventoryDefaults: {
        defaultReorderLevel: 20,
        defaultMinimumStock: 10,
        totalCategories: 5,
      },
    };
  }

  public async setupBuilding(
    organizationId: string,
    dto: CreateBuildingSetupDto
  ): Promise<BuildingSetupResultDto> {
    return this.buildingSetupService.setupBuilding(organizationId, dto);
  }

  public async getBuildingOccupancyTree(
    buildingId: string,
    organizationId: string
  ): Promise<BuildingOccupancyTreeDto> {
    return this.floorRoomBedService.getBuildingOccupancyTree(buildingId, organizationId);
  }

  // --- PROPERTIES ---
  public async createProperty(
    organizationId: string,
    dto: CreatePropertyDto
  ): Promise<PropertyDto> {
    return this.propertyBuildingService.createProperty(organizationId, dto);
  }

  public async getProperties(
    organizationId: string,
    params: PaginationParams,
    search?: string,
    status?: string
  ): Promise<PaginatedResult<PropertyDto>> {
    return this.propertyBuildingService.getProperties(organizationId, params, search, status);
  }

  public async getPropertyById(id: string, organizationId: string): Promise<PropertyDto> {
    return this.propertyBuildingService.getPropertyById(id, organizationId);
  }

  public async updateProperty(
    id: string,
    organizationId: string,
    dto: UpdatePropertyDto
  ): Promise<PropertyDto> {
    return this.propertyBuildingService.updateProperty(id, organizationId, dto);
  }

  public async deleteProperty(id: string, organizationId: string): Promise<void> {
    return this.propertyBuildingService.deleteProperty(id, organizationId);
  }

  // --- BUILDINGS ---
  public async createBuilding(
    propertyId: string,
    organizationId: string,
    dto: CreateBuildingDto
  ): Promise<BuildingDto> {
    return this.propertyBuildingService.createBuilding(propertyId, organizationId, dto);
  }

  public async getBuildings(
    propertyId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<BuildingDto>> {
    return this.propertyBuildingService.getBuildings(propertyId, organizationId, params);
  }

  public async getBuildingById(id: string, organizationId: string): Promise<BuildingDto> {
    return this.propertyBuildingService.getBuildingById(id, organizationId);
  }

  public async updateBuilding(
    id: string,
    organizationId: string,
    dto: UpdateBuildingDto
  ): Promise<BuildingDto> {
    return this.propertyBuildingService.updateBuilding(id, organizationId, dto);
  }

  public async deleteBuilding(id: string, organizationId: string): Promise<void> {
    return this.propertyBuildingService.deleteBuilding(id, organizationId);
  }

  // --- FLOORS ---
  public async createFloor(
    buildingId: string,
    organizationId: string,
    dto: CreateFloorDto
  ): Promise<FloorDto> {
    return this.floorRoomBedService.createFloor(buildingId, organizationId, dto);
  }

  public async getFloors(
    buildingId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<FloorDto>> {
    return this.floorRoomBedService.getFloors(buildingId, organizationId, params);
  }

  public async getFloorById(id: string, organizationId: string): Promise<FloorDto> {
    return this.floorRoomBedService.getFloorById(id, organizationId);
  }

  public async updateFloor(
    id: string,
    organizationId: string,
    dto: UpdateFloorDto
  ): Promise<FloorDto> {
    return this.floorRoomBedService.updateFloor(id, organizationId, dto);
  }

  public async deleteFloor(id: string, organizationId: string): Promise<void> {
    return this.floorRoomBedService.deleteFloor(id, organizationId);
  }

  // --- ROOMS ---
  public async createRoom(
    floorId: string,
    organizationId: string,
    dto: CreateRoomDto
  ): Promise<RoomDto> {
    return this.floorRoomBedService.createRoom(floorId, organizationId, dto);
  }

  public async getRooms(
    floorId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<RoomDto>> {
    return this.floorRoomBedService.getRooms(floorId, organizationId, params);
  }

  public async getRoomById(id: string, organizationId: string): Promise<RoomDto> {
    return this.floorRoomBedService.getRoomById(id, organizationId);
  }

  public async updateRoomCapacity(
    roomId: string,
    organizationId: string,
    dto: UpdateCapacityDto
  ): Promise<RoomDto> {
    return this.floorRoomBedService.updateRoomCapacity(roomId, organizationId, dto);
  }

  public async updateRoom(
    id: string,
    organizationId: string,
    dto: UpdateRoomDto
  ): Promise<RoomDto> {
    return this.floorRoomBedService.updateRoom(id, organizationId, dto);
  }

  public async deleteRoom(id: string, organizationId: string): Promise<void> {
    return this.floorRoomBedService.deleteRoom(id, organizationId);
  }

  // --- BEDS ---
  public async createBed(
    roomId: string,
    organizationId: string,
    dto: CreateBedDto
  ): Promise<BedDto> {
    return this.floorRoomBedService.createBed(roomId, organizationId, dto);
  }

  public async getBeds(
    roomId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<BedDto>> {
    return this.floorRoomBedService.getBeds(roomId, organizationId, params);
  }

  public async updateBedStatus(
    id: string,
    organizationId: string,
    dto: UpdateBedStatusDto
  ): Promise<BedDto> {
    return this.floorRoomBedService.updateBedStatus(id, organizationId, dto);
  }

  public async getBedById(id: string, organizationId: string): Promise<BedDto> {
    return this.floorRoomBedService.getBedById(id, organizationId);
  }

  public async updateBed(
    id: string,
    organizationId: string,
    dto: UpdateBedDto
  ): Promise<BedDto> {
    return this.floorRoomBedService.updateBed(id, organizationId, dto);
  }

  public async deleteBed(id: string, organizationId: string): Promise<void> {
    return this.floorRoomBedService.deleteBed(id, organizationId);
  }

  // --- FACILITIES ---
  public async createFacility(
    organizationId: string,
    dto: CreateFacilityDto
  ): Promise<FacilityDto> {
    return this.facilityService.createFacility(organizationId, dto);
  }

  public async getFacilities(
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<FacilityDto>> {
    return this.facilityService.getFacilities(organizationId, params);
  }

  public async assignFacilityToProperty(
    propertyId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    return this.facilityService.assignFacilityToProperty(propertyId, facilityId, organizationId);
  }

  public async unassignFacilityFromProperty(
    propertyId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    return this.facilityService.unassignFacilityFromProperty(
      propertyId,
      facilityId,
      organizationId
    );
  }

  public async assignFacilityToBuilding(
    buildingId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    return this.facilityService.assignFacilityToBuilding(buildingId, facilityId, organizationId);
  }

  public async unassignFacilityFromBuilding(
    buildingId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    return this.facilityService.unassignFacilityFromBuilding(
      buildingId,
      facilityId,
      organizationId
    );
  }

  public async assignFacilityToRoom(
    roomId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    return this.facilityService.assignFacilityToRoom(roomId, facilityId, organizationId);
  }

  public async unassignFacilityFromRoom(
    roomId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    return this.facilityService.unassignFacilityFromRoom(roomId, facilityId, organizationId);
  }

  public async getFacilitiesForRoom(
    roomId: string,
    organizationId: string
  ): Promise<FacilityDto[]> {
    return this.facilityService.getFacilitiesForRoom(roomId, organizationId);
  }
}
