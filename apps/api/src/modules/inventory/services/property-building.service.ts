import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { dbService, KyselyBuildingRepository, KyselyPropertyRepository } from '@m-square/database';
import type { BuildingRow, PropertyRow } from '@m-square/database';
import type {
  BuildingDto,
  PaginatedResult,
  PaginationParams,
  PropertyDto,
} from '@m-square/contracts';
import type { CreatePropertyDto } from '../dto/create-property.dto';
import type { UpdatePropertyDto } from '../dto/update-property.dto';
import type { CreateBuildingDto } from '../dto/create-building.dto';

@Injectable()
export class PropertyBuildingService {
  private readonly db = dbService.db;
  private readonly propertyRepo = new KyselyPropertyRepository(this.db);
  private readonly buildingRepo = new KyselyBuildingRepository(this.db);

  // --- PROPERTIES ---
  public async createProperty(
    organizationId: string,
    dto: CreatePropertyDto
  ): Promise<PropertyDto> {
    try {
      const row = await this.propertyRepo.createForOrganization(organizationId, {
        name: dto.name,
        code: dto.code,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        locality: dto.locality,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
      });

      return this.mapPropertyRow(row);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException(`Property code '${dto.code}' already exists`);
      }
      throw err;
    }
  }

  public async getProperties(
    organizationId: string,
    params: PaginationParams,
    search?: string,
    status?: string
  ): Promise<PaginatedResult<PropertyDto>> {
    const res = await this.propertyRepo.findAllForOrganization(
      organizationId,
      params,
      search,
      status
    );
    return {
      ...res,
      items: res.items.map((r) => this.mapPropertyRow(r)),
    };
  }

  public async getPropertyById(id: string, organizationId: string): Promise<PropertyDto> {
    const row = await this.propertyRepo.findByIdForOrganization(id, organizationId);
    if (!row) throw new NotFoundException('Property not found');
    return this.mapPropertyRow(row);
  }

  public async updateProperty(
    id: string,
    organizationId: string,
    dto: UpdatePropertyDto
  ): Promise<PropertyDto> {
    const row = await this.propertyRepo.updateForOrganization(id, organizationId, dto);
    if (!row) throw new NotFoundException('Property not found');
    return this.mapPropertyRow(row);
  }

  public async deleteProperty(id: string, organizationId: string): Promise<void> {
    const count = await this.propertyRepo.countBuildingsInProperty(id, organizationId);
    if (count > 0) {
      throw new BadRequestException('Cannot delete property containing active buildings');
    }
    const deleted = await this.propertyRepo.deleteForOrganization(id, organizationId);
    if (!deleted) throw new NotFoundException('Property not found');
  }

  // --- BUILDINGS ---
  public async createBuilding(
    propertyId: string,
    organizationId: string,
    dto: CreateBuildingDto
  ): Promise<BuildingDto> {
    const property = await this.propertyRepo.findByIdForOrganization(propertyId, organizationId);
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot create building under an inactive property');
    }

    try {
      const row = await this.buildingRepo.createForOrganization(organizationId, {
        propertyId,
        name: dto.name,
        code: dto.code,
        displayOrder: dto.displayOrder,
      });

      return this.mapBuildingRow(row);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException(`Building code '${dto.code}' already exists in this property`);
      }
      throw err;
    }
  }

  public async getBuildings(
    propertyId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<BuildingDto>> {
    const property = await this.propertyRepo.findByIdForOrganization(propertyId, organizationId);
    if (!property) throw new NotFoundException('Property not found');

    const res = await this.buildingRepo.findAllByProperty(propertyId, organizationId, params);
    return {
      ...res,
      items: res.items.map((r) => this.mapBuildingRow(r)),
    };
  }

  public async getBuildingById(id: string, organizationId: string): Promise<BuildingDto> {
    const row = await this.buildingRepo.findByIdForOrganization(id, organizationId);
    if (!row) throw new NotFoundException('Building not found');
    return this.mapBuildingRow(row);
  }

  // --- MAPPERS ---
  private mapPropertyRow(r: PropertyRow): PropertyDto {
    return {
      id: r.id,
      organizationId: r.organization_id,
      name: r.name,
      code: r.code,
      address: {
        addressLine1: r.address_line1,
        addressLine2: r.address_line2,
        locality: r.locality,
        city: r.city,
        state: r.state,
        postalCode: r.postal_code,
      },
      status: r.status as 'ACTIVE' | 'INACTIVE',
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }

  private mapBuildingRow(r: BuildingRow): BuildingDto {
    return {
      id: r.id,
      propertyId: r.property_id,
      organizationId: r.organization_id,
      name: r.name,
      code: r.code,
      displayOrder: r.display_order,
      status: r.status as 'ACTIVE' | 'INACTIVE',
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }
}
