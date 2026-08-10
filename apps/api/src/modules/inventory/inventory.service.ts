import { Injectable } from '@nestjs/common';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
import type {
  BedDto,
  BuildingDto,
  FacilityDto,
  FloorDto,
  PropertyDto,
  RoomDto,
} from '@m-square/contracts';
import { PropertyBuildingService } from './services/property-building.service';
import { FloorRoomBedService } from './services/floor-room-bed.service';
import { FacilityService } from './services/facility.service';
import type { CreatePropertyDto } from './dto/create-property.dto';
import type { UpdatePropertyDto } from './dto/update-property.dto';
import type { CreateBuildingDto } from './dto/create-building.dto';
import type { CreateFloorDto } from './dto/create-floor.dto';
import type { CreateRoomDto } from './dto/create-room.dto';
import type { UpdateCapacityDto } from './dto/update-capacity.dto';
import type { CreateBedDto } from './dto/create-bed.dto';
import type { UpdateBedStatusDto } from './dto/update-bed-status.dto';
import type { CreateFacilityDto } from './dto/create-facility.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly propertyBuildingService: PropertyBuildingService,
    private readonly floorRoomBedService: FloorRoomBedService,
    private readonly facilityService: FacilityService
  ) {}

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
}
