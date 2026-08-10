import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  dbService,
  KyselyBuildingRepository,
  KyselyFacilityRepository,
  KyselyPropertyRepository,
  KyselyRoomRepository,
} from '@m-square/database';
import type { FacilityRow } from '@m-square/database';
import type { FacilityDto, PaginatedResult, PaginationParams } from '@m-square/contracts';
import type { CreateFacilityDto } from '../dto/create-facility.dto';

@Injectable()
export class FacilityService {
  private readonly db = dbService.db;
  private readonly propertyRepo = new KyselyPropertyRepository(this.db);
  private readonly buildingRepo = new KyselyBuildingRepository(this.db);
  private readonly roomRepo = new KyselyRoomRepository(this.db);
  private readonly facilityRepo = new KyselyFacilityRepository(this.db);

  public async createFacility(
    organizationId: string,
    dto: CreateFacilityDto
  ): Promise<FacilityDto> {
    try {
      const row = await this.facilityRepo.createForOrganization(organizationId, {
        name: dto.name,
        code: dto.code,
        category: dto.category,
        description: dto.description,
      });

      return this.mapFacilityRow(row);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException(`Facility code '${dto.code}' already exists`);
      }
      throw err;
    }
  }

  public async getFacilities(
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<FacilityDto>> {
    const res = await this.facilityRepo.findAllForOrganization(organizationId, params);
    return {
      ...res,
      items: res.items.map((r) => this.mapFacilityRow(r)),
    };
  }

  public async assignFacilityToProperty(
    propertyId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    const prop = await this.propertyRepo.findByIdForOrganization(propertyId, organizationId);
    if (!prop) throw new NotFoundException('Property not found');

    const fac = await this.facilityRepo.findByIdForOrganization(facilityId, organizationId);
    if (!fac) throw new NotFoundException('Facility not found');

    await this.facilityRepo.assignToProperty(propertyId, facilityId, organizationId);
  }

  public async unassignFacilityFromProperty(
    propertyId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    await this.facilityRepo.unassignFromProperty(propertyId, facilityId, organizationId);
  }

  public async assignFacilityToBuilding(
    buildingId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    const bldg = await this.buildingRepo.findByIdForOrganization(buildingId, organizationId);
    if (!bldg) throw new NotFoundException('Building not found');

    const fac = await this.facilityRepo.findByIdForOrganization(facilityId, organizationId);
    if (!fac) throw new NotFoundException('Facility not found');

    await this.facilityRepo.assignToBuilding(buildingId, facilityId, organizationId);
  }

  public async unassignFacilityFromBuilding(
    buildingId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    await this.facilityRepo.unassignFromBuilding(buildingId, facilityId, organizationId);
  }

  public async assignFacilityToRoom(
    roomId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    const room = await this.roomRepo.findByIdForOrganization(roomId, organizationId);
    if (!room) throw new NotFoundException('Room not found');

    const fac = await this.facilityRepo.findByIdForOrganization(facilityId, organizationId);
    if (!fac) throw new NotFoundException('Facility not found');

    await this.facilityRepo.assignToRoom(roomId, facilityId, organizationId);
  }

  public async unassignFacilityFromRoom(
    roomId: string,
    facilityId: string,
    organizationId: string
  ): Promise<void> {
    await this.facilityRepo.unassignFromRoom(roomId, facilityId, organizationId);
  }

  private mapFacilityRow(r: FacilityRow): FacilityDto {
    return {
      id: r.id,
      organizationId: r.organization_id,
      name: r.name,
      code: r.code,
      category: r.category as FacilityDto['category'],
      description: r.description,
      status: r.status as FacilityDto['status'],
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }
}
