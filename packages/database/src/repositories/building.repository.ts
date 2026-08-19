import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
import { calculatePaginationBounds, createPaginatedResult } from '@m-square/contracts';

export interface BuildingRow {
  id: string;
  property_id: string;
  organization_id: string;
  name: string;
  code: string;
  display_order: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBuildingData {
  propertyId: string;
  name: string;
  code: string;
  displayOrder?: number;
  status?: string;
}

export interface UpdateBuildingData {
  name?: string;
  code?: string;
  displayOrder?: number;
  status?: string;
}

export class KyselyBuildingRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private getExecutor(trx?: Transaction<DatabaseSchema>) {
    return trx && typeof (trx as unknown as Record<string, unknown>).selectFrom === 'function'
      ? trx
      : this.db;
  }

  public async findByIdForOrganization(
    id: string,
    organizationId: string
  ): Promise<BuildingRow | null> {
    const row = await this.db
      .selectFrom('buildings')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return (row as BuildingRow) || null;
  }

  public async findAllByProperty(
    propertyId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<BuildingRow>> {
    const { offset, limit } = calculatePaginationBounds(params.page, params.pageSize);

    const countResult = await this.db
      .selectFrom('buildings')
      .select(this.db.fn.count<string>('id').as('total'))
      .where('property_id', '=', propertyId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    const total = parseInt(countResult.total, 10);

    const rows = await this.db
      .selectFrom('buildings')
      .selectAll()
      .where('property_id', '=', propertyId)
      .where('organization_id', '=', organizationId)
      .orderBy('display_order', 'asc')
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();

    return createPaginatedResult(rows as BuildingRow[], total, params.page, params.pageSize);
  }

  public async createForOrganization(
    organizationId: string,
    data: CreateBuildingData,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BuildingRow> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .insertInto('buildings')
      .values({
        property_id: data.propertyId,
        organization_id: organizationId,
        name: data.name,
        code: data.code.toUpperCase(),
        display_order: data.displayOrder || 0,
        status: data.status || 'ACTIVE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as BuildingRow;
  }

  public async updateForOrganization(
    id: string,
    organizationId: string,
    data: UpdateBuildingData
  ): Promise<BuildingRow | null> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.code !== undefined) updatePayload['code'] = data.code.toUpperCase();
    if (data.displayOrder !== undefined) updatePayload['display_order'] = data.displayOrder;
    if (data.status !== undefined) updatePayload['status'] = data.status;

    const row = await this.db
      .updateTable('buildings')
      .set(updatePayload)
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as BuildingRow) || null;
  }

  public async deleteForOrganization(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('buildings')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  public async countFloorsInBuilding(buildingId: string, organizationId: string): Promise<number> {
    const res = await this.db
      .selectFrom('floors')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('building_id', '=', buildingId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    return parseInt(res.cnt, 10);
  }
}
