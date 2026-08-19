import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
import { calculatePaginationBounds, createPaginatedResult } from '@m-square/contracts';

export interface BedRow {
  id: string;
  room_id: string;
  organization_id: string;
  bed_number: string;
  display_order: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBedData {
  roomId: string;
  bedNumber: string;
  displayOrder?: number;
  status?: string;
}

export interface UpdateBedData {
  bedNumber?: string;
  displayOrder?: number;
  status?: string;
}

export class KyselyBedRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private getExecutor(trx?: Transaction<DatabaseSchema>) {
    return trx && typeof (trx as unknown as Record<string, unknown>).selectFrom === 'function'
      ? trx
      : this.db;
  }

  public async findByIdForOrganization(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('beds')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return (row as BedRow) || null;
  }

  public async findByIdForUpdate(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('beds')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .forUpdate()
      .executeTakeFirst();

    return (row as BedRow) || null;
  }

  public async findAllByRoom(
    roomId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<BedRow>> {
    const { offset, limit } = calculatePaginationBounds(params.page, params.pageSize);

    const countResult = await this.db
      .selectFrom('beds')
      .select(this.db.fn.count<string>('id').as('total'))
      .where('room_id', '=', roomId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    const total = parseInt(countResult.total, 10);

    const rows = await this.db
      .selectFrom('beds')
      .selectAll()
      .where('room_id', '=', roomId)
      .where('organization_id', '=', organizationId)
      .orderBy('display_order', 'asc')
      .orderBy('bed_number', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();

    return createPaginatedResult(rows as BedRow[], total, params.page, params.pageSize);
  }

  /**
   * Count active beds in room (AVAILABLE or MAINTENANCE).
   * Used in capacity calculations under room FOR UPDATE lock.
   */
  public async countActiveBedsInRoom(
    roomId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<number> {
    const executor = this.getExecutor(trx);
    const res = await executor
      .selectFrom('beds')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('room_id', '=', roomId)
      .where('organization_id', '=', organizationId)
      .where('status', 'in', ['AVAILABLE', 'MAINTENANCE'])
      .executeTakeFirstOrThrow();

    return parseInt(res.cnt, 10);
  }

  public async createForOrganization(
    organizationId: string,
    data: CreateBedData,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedRow> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .insertInto('beds')
      .values({
        room_id: data.roomId,
        organization_id: organizationId,
        bed_number: data.bedNumber,
        display_order: data.displayOrder || 0,
        status: data.status || 'AVAILABLE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as BedRow;
  }

  public async updateStatus(
    id: string,
    organizationId: string,
    status: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .updateTable('beds')
      .set({
        status,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as BedRow) || null;
  }

  public async updateForOrganization(
    id: string,
    organizationId: string,
    data: UpdateBedData,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedRow | null> {
    const executor = this.getExecutor(trx);
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (data.bedNumber !== undefined) updatePayload['bed_number'] = data.bedNumber;
    if (data.displayOrder !== undefined) updatePayload['display_order'] = data.displayOrder;
    if (data.status !== undefined) updatePayload['status'] = data.status;

    const row = await executor
      .updateTable('beds')
      .set(updatePayload)
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as BedRow) || null;
  }

  public async deleteForOrganization(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('beds')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }
}
