import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
import { calculatePaginationBounds, createPaginatedResult } from '@m-square/contracts';

export interface FloorRow {
  id: string;
  building_id: string;
  organization_id: string;
  name: string;
  floor_number: number;
  display_order: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFloorData {
  buildingId: string;
  name: string;
  floorNumber: number;
  displayOrder?: number;
  status?: string;
}

export interface UpdateFloorData {
  name?: string;
  floorNumber?: number;
  displayOrder?: number;
  status?: string;
}

export class KyselyFloorRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findByIdForOrganization(
    id: string,
    organizationId: string
  ): Promise<FloorRow | null> {
    const row = await this.db
      .selectFrom('floors')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return (row as FloorRow) || null;
  }

  public async findAllByBuilding(
    buildingId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<FloorRow>> {
    const { offset, limit } = calculatePaginationBounds(params.page, params.pageSize);

    const countResult = await this.db
      .selectFrom('floors')
      .select(this.db.fn.count<string>('id').as('total'))
      .where('building_id', '=', buildingId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    const total = parseInt(countResult.total, 10);

    const rows = await this.db
      .selectFrom('floors')
      .selectAll()
      .where('building_id', '=', buildingId)
      .where('organization_id', '=', organizationId)
      .orderBy('floor_number', 'asc')
      .orderBy('display_order', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();

    return createPaginatedResult(rows as FloorRow[], total, params.page, params.pageSize);
  }

  public async createForOrganization(
    organizationId: string,
    data: CreateFloorData
  ): Promise<FloorRow> {
    const row = await this.db
      .insertInto('floors')
      .values({
        building_id: data.buildingId,
        organization_id: organizationId,
        name: data.name,
        floor_number: data.floorNumber,
        display_order: data.displayOrder || 0,
        status: data.status || 'ACTIVE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as FloorRow;
  }

  public async updateForOrganization(
    id: string,
    organizationId: string,
    data: UpdateFloorData
  ): Promise<FloorRow | null> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.floorNumber !== undefined) updatePayload['floor_number'] = data.floorNumber;
    if (data.displayOrder !== undefined) updatePayload['display_order'] = data.displayOrder;
    if (data.status !== undefined) updatePayload['status'] = data.status;

    const row = await this.db
      .updateTable('floors')
      .set(updatePayload)
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as FloorRow) || null;
  }

  public async deleteForOrganization(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('floors')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  public async countRoomsInFloor(floorId: string, organizationId: string): Promise<number> {
    const res = await this.db
      .selectFrom('rooms')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('floor_id', '=', floorId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    return parseInt(res.cnt, 10);
  }
}
