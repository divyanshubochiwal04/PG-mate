import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
import { calculatePaginationBounds, createPaginatedResult } from '@m-square/contracts';

export interface FacilityRow {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  category: string;
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFacilityData {
  name: string;
  code: string;
  category?: string;
  description?: string | null;
  status?: string;
}

export interface UpdateFacilityData {
  name?: string;
  code?: string;
  category?: string;
  description?: string | null;
  status?: string;
}

export class KyselyFacilityRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findByIdForOrganization(
    id: string,
    organizationId: string
  ): Promise<FacilityRow | null> {
    const row = await this.db
      .selectFrom('facilities')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return (row as FacilityRow) || null;
  }

  public async findAllForOrganization(
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<FacilityRow>> {
    const { offset, limit } = calculatePaginationBounds(params.page, params.pageSize);

    const countResult = await this.db
      .selectFrom('facilities')
      .select(this.db.fn.count<string>('id').as('total'))
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    const total = parseInt(countResult.total, 10);

    const rows = await this.db
      .selectFrom('facilities')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .orderBy('name', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();

    return createPaginatedResult(rows as FacilityRow[], total, params.page, params.pageSize);
  }

  public async createForOrganization(
    organizationId: string,
    data: CreateFacilityData
  ): Promise<FacilityRow> {
    const row = await this.db
      .insertInto('facilities')
      .values({
        organization_id: organizationId,
        name: data.name,
        code: data.code.toUpperCase(),
        category: data.category || 'GENERAL',
        description: data.description || null,
        status: data.status || 'ACTIVE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as FacilityRow;
  }

  public async updateForOrganization(
    id: string,
    organizationId: string,
    data: UpdateFacilityData
  ): Promise<FacilityRow | null> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.code !== undefined) updatePayload['code'] = data.code.toUpperCase();
    if (data.category !== undefined) updatePayload['category'] = data.category;
    if (data.description !== undefined) updatePayload['description'] = data.description;
    if (data.status !== undefined) updatePayload['status'] = data.status;

    const row = await this.db
      .updateTable('facilities')
      .set(updatePayload)
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as FacilityRow) || null;
  }

  // Facility Assignments (Property, Building, Room)
  public async assignToProperty(
    propertyId: string,
    facilityId: string,
    organizationId: string
  ): Promise<boolean> {
    const res = await this.db
      .insertInto('property_facilities')
      .values({
        property_id: propertyId,
        facility_id: facilityId,
        organization_id: organizationId,
      })
      .onConflict((oc) => oc.columns(['property_id', 'facility_id']).doNothing())
      .execute();

    return Number(res.length) > 0;
  }

  public async unassignFromProperty(
    propertyId: string,
    facilityId: string,
    organizationId: string
  ): Promise<boolean> {
    const result = await this.db
      .deleteFrom('property_facilities')
      .where('property_id', '=', propertyId)
      .where('facility_id', '=', facilityId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  public async assignToBuilding(
    buildingId: string,
    facilityId: string,
    organizationId: string
  ): Promise<boolean> {
    const res = await this.db
      .insertInto('building_facilities')
      .values({
        building_id: buildingId,
        facility_id: facilityId,
        organization_id: organizationId,
      })
      .onConflict((oc) => oc.columns(['building_id', 'facility_id']).doNothing())
      .execute();

    return Number(res.length) > 0;
  }

  public async unassignFromBuilding(
    buildingId: string,
    facilityId: string,
    organizationId: string
  ): Promise<boolean> {
    const result = await this.db
      .deleteFrom('building_facilities')
      .where('building_id', '=', buildingId)
      .where('facility_id', '=', facilityId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  public async assignToRoom(
    roomId: string,
    facilityId: string,
    organizationId: string
  ): Promise<boolean> {
    const res = await this.db
      .insertInto('room_facilities')
      .values({
        room_id: roomId,
        facility_id: facilityId,
        organization_id: organizationId,
      })
      .onConflict((oc) => oc.columns(['room_id', 'facility_id']).doNothing())
      .execute();

    return Number(res.length) > 0;
  }

  public async unassignFromRoom(
    roomId: string,
    facilityId: string,
    organizationId: string
  ): Promise<boolean> {
    const result = await this.db
      .deleteFrom('room_facilities')
      .where('room_id', '=', roomId)
      .where('facility_id', '=', facilityId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}
