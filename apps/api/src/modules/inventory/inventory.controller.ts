import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantAuthorizationGuard } from '../tenant/guards/tenant-authorization.guard';
import { RequestContext } from '../../common/context/request-context';
import { InventoryService } from './inventory.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateBuildingDto } from './dto/create-building.dto';
import { CreateFloorDto } from './dto/create-floor.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedStatusDto } from './dto/update-bed-status.dto';
import { CreateFacilityDto } from './dto/create-facility.dto';
import type {
  BedDto,
  BuildingDto,
  FacilityDto,
  FloorDto,
  PaginatedResult,
  PropertyDto,
  RoomDto,
} from '@m-square/contracts';

@ApiTags('Physical Inventory')
@Controller()
@UseGuards(JwtAuthGuard, TenantAuthorizationGuard)
@ApiBearerAuth('bearer-auth')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- PROPERTIES ---
  @Post('properties')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new PG property' })
  @SwaggerResponse({ status: 201, description: 'Property created' })
  async createProperty(@Body() dto: CreatePropertyDto): Promise<PropertyDto> {
    return this.inventoryService.createProperty(this.getOrgId(), dto);
  }

  @Get('properties')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List properties (Paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 10 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getProperties(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ): Promise<PaginatedResult<PropertyDto>> {
    const params = { page: Number(page) || 1, pageSize: Number(pageSize) || 10 };
    return this.inventoryService.getProperties(this.getOrgId(), params, search, status);
  }

  @Get('properties/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get property details by ID' })
  async getPropertyById(@Param('id') id: string): Promise<PropertyDto> {
    return this.inventoryService.getPropertyById(id, this.getOrgId());
  }

  @Put('properties/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update property details' })
  async updateProperty(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto
  ): Promise<PropertyDto> {
    return this.inventoryService.updateProperty(id, this.getOrgId(), dto);
  }

  @Delete('properties/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete property (blocked if contains buildings)' })
  async deleteProperty(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.inventoryService.deleteProperty(id, this.getOrgId());
    return { success: true };
  }

  // --- BUILDINGS ---
  @Post('properties/:propertyId/buildings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new building in property' })
  async createBuilding(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateBuildingDto
  ): Promise<BuildingDto> {
    return this.inventoryService.createBuilding(propertyId, this.getOrgId(), dto);
  }

  @Get('properties/:propertyId/buildings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List buildings in property (Paginated)' })
  async getBuildings(
    @Param('propertyId') propertyId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): Promise<PaginatedResult<BuildingDto>> {
    const params = { page: Number(page) || 1, pageSize: Number(pageSize) || 10 };
    return this.inventoryService.getBuildings(propertyId, this.getOrgId(), params);
  }

  @Get('buildings/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get building details by ID' })
  async getBuildingById(@Param('id') id: string): Promise<BuildingDto> {
    return this.inventoryService.getBuildingById(id, this.getOrgId());
  }

  // --- FLOORS ---
  @Post('buildings/:buildingId/floors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a floor in building' })
  async createFloor(
    @Param('buildingId') buildingId: string,
    @Body() dto: CreateFloorDto
  ): Promise<FloorDto> {
    return this.inventoryService.createFloor(buildingId, this.getOrgId(), dto);
  }

  @Get('buildings/:buildingId/floors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List floors in building (Paginated)' })
  async getFloors(
    @Param('buildingId') buildingId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): Promise<PaginatedResult<FloorDto>> {
    const params = { page: Number(page) || 1, pageSize: Number(pageSize) || 10 };
    return this.inventoryService.getFloors(buildingId, this.getOrgId(), params);
  }

  @Get('floors/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get floor details by ID' })
  async getFloorById(@Param('id') id: string): Promise<FloorDto> {
    return this.inventoryService.getFloorById(id, this.getOrgId());
  }

  // --- ROOMS ---
  @Post('floors/:floorId/rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a room on floor' })
  async createRoom(
    @Param('floorId') floorId: string,
    @Body() dto: CreateRoomDto
  ): Promise<RoomDto> {
    return this.inventoryService.createRoom(floorId, this.getOrgId(), dto);
  }

  @Get('floors/:floorId/rooms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List rooms on floor (Paginated)' })
  async getRooms(
    @Param('floorId') floorId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): Promise<PaginatedResult<RoomDto>> {
    const params = { page: Number(page) || 1, pageSize: Number(pageSize) || 10 };
    return this.inventoryService.getRooms(floorId, this.getOrgId(), params);
  }

  @Get('rooms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get room details by ID' })
  async getRoomById(@Param('id') id: string): Promise<RoomDto> {
    return this.inventoryService.getRoomById(id, this.getOrgId());
  }

  @Patch('rooms/:id/capacity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update room bed capacity (serialized under room lock)' })
  async updateRoomCapacity(
    @Param('id') id: string,
    @Body() dto: UpdateCapacityDto
  ): Promise<RoomDto> {
    return this.inventoryService.updateRoomCapacity(id, this.getOrgId(), dto);
  }

  // --- BEDS ---
  @Post('rooms/:roomId/beds')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a bed in room (serialized under room lock)' })
  async createBed(@Param('roomId') roomId: string, @Body() dto: CreateBedDto): Promise<BedDto> {
    return this.inventoryService.createBed(roomId, this.getOrgId(), dto);
  }

  @Get('rooms/:roomId/beds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List beds in room (Paginated)' })
  async getBeds(
    @Param('roomId') roomId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): Promise<PaginatedResult<BedDto>> {
    const params = { page: Number(page) || 1, pageSize: Number(pageSize) || 10 };
    return this.inventoryService.getBeds(roomId, this.getOrgId(), params);
  }

  @Patch('beds/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update bed status (AVAILABLE, INACTIVE, MAINTENANCE)' })
  async updateBedStatus(@Param('id') id: string, @Body() dto: UpdateBedStatusDto): Promise<BedDto> {
    return this.inventoryService.updateBedStatus(id, this.getOrgId(), dto);
  }

  // --- FACILITIES ---
  @Post('facilities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a catalog facility' })
  async createFacility(@Body() dto: CreateFacilityDto): Promise<FacilityDto> {
    return this.inventoryService.createFacility(this.getOrgId(), dto);
  }

  @Get('facilities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List catalog facilities (Paginated)' })
  async getFacilities(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): Promise<PaginatedResult<FacilityDto>> {
    const params = { page: Number(page) || 1, pageSize: Number(pageSize) || 10 };
    return this.inventoryService.getFacilities(this.getOrgId(), params);
  }

  @Post('properties/:id/facilities/:facilityId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign facility to property' })
  async assignFacilityToProperty(
    @Param('id') id: string,
    @Param('facilityId') facilityId: string
  ): Promise<{ success: boolean }> {
    await this.inventoryService.assignFacilityToProperty(id, facilityId, this.getOrgId());
    return { success: true };
  }

  @Delete('properties/:id/facilities/:facilityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unassign facility from property' })
  async unassignFacilityFromProperty(
    @Param('id') id: string,
    @Param('facilityId') facilityId: string
  ): Promise<{ success: boolean }> {
    await this.inventoryService.unassignFacilityFromProperty(id, facilityId, this.getOrgId());
    return { success: true };
  }

  @Post('buildings/:id/facilities/:facilityId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign facility to building' })
  async assignFacilityToBuilding(
    @Param('id') id: string,
    @Param('facilityId') facilityId: string
  ): Promise<{ success: boolean }> {
    await this.inventoryService.assignFacilityToBuilding(id, facilityId, this.getOrgId());
    return { success: true };
  }

  @Delete('buildings/:id/facilities/:facilityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unassign facility from building' })
  async unassignFacilityFromBuilding(
    @Param('id') id: string,
    @Param('facilityId') facilityId: string
  ): Promise<{ success: boolean }> {
    await this.inventoryService.unassignFacilityFromBuilding(id, facilityId, this.getOrgId());
    return { success: true };
  }

  @Post('rooms/:id/facilities/:facilityId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign facility to room' })
  async assignFacilityToRoom(
    @Param('id') id: string,
    @Param('facilityId') facilityId: string
  ): Promise<{ success: boolean }> {
    await this.inventoryService.assignFacilityToRoom(id, facilityId, this.getOrgId());
    return { success: true };
  }

  @Delete('rooms/:id/facilities/:facilityId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unassign facility from room' })
  async unassignFacilityFromRoom(
    @Param('id') id: string,
    @Param('facilityId') facilityId: string
  ): Promise<{ success: boolean }> {
    await this.inventoryService.unassignFacilityFromRoom(id, facilityId, this.getOrgId());
    return { success: true };
  }

  private getOrgId(): string {
    const orgId = RequestContext.organizationId;
    if (!orgId) {
      throw new Error('Organization ID context missing in inventory controller request');
    }
    return orgId;
  }
}
