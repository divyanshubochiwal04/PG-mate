import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
import { calculatePaginationBounds, createPaginatedResult } from '@m-square/contracts';

export interface RoomRow {
  id: string;
  floor_id: string;
  building_id: string;
  property_id: string;
  organization_id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  display_order: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoomData {
  floorId: string;
  buildingId: string;
  propertyId: string;
  roomNumber: string;
  roomType?: string;
  capacity: number;
  displayOrder?: number;
  status?: string;
}

export interface UpdateRoomData {
  roomNumber?: string;
  roomType?: string;
  displayOrder?: number;
  status?: string;
}

export class KyselyRoomRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findByIdForOrganization(
    id: string,
    organizationId: string
  ): Promise<RoomRow | null> {
    const row = await this.db
      .selectFrom('rooms')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return (row as RoomRow) || null;
  }

  /**
   * Acquire a FOR UPDATE row lock on the room row for serializing capacity operations.
   */
  public async findByIdForUpdate(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<RoomRow | null> {
    const executor = trx || this.db;
    const row = await executor
      .selectFrom('rooms')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .forUpdate()
      .executeTakeFirst();

    return (row as RoomRow) || null;
  }

  public async findAllByFloor(
    floorId: string,
    organizationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<RoomRow>> {
    const { offset, limit } = calculatePaginationBounds(params.page, params.pageSize);

    const countResult = await this.db
      .selectFrom('rooms')
      .select(this.db.fn.count<string>('id').as('total'))
      .where('floor_id', '=', floorId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    const total = parseInt(countResult.total, 10);

    const rows = await this.db
      .selectFrom('rooms')
      .selectAll()
      .where('floor_id', '=', floorId)
      .where('organization_id', '=', organizationId)
      .orderBy('display_order', 'asc')
      .orderBy('room_number', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();

    return createPaginatedResult(rows as RoomRow[], total, params.page, params.pageSize);
  }

  public async createForOrganization(
    organizationId: string,
    data: CreateRoomData
  ): Promise<RoomRow> {
    const row = await this.db
      .insertInto('rooms')
      .values({
        floor_id: data.floorId,
        building_id: data.buildingId,
        property_id: data.propertyId,
        organization_id: organizationId,
        room_number: data.roomNumber,
        room_type: data.roomType || 'DOUBLE',
        capacity: data.capacity,
        display_order: data.displayOrder || 0,
        status: data.status || 'ACTIVE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as RoomRow;
  }

  public async updateForOrganization(
    id: string,
    organizationId: string,
    data: UpdateRoomData
  ): Promise<RoomRow | null> {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (data.roomNumber !== undefined) updatePayload['room_number'] = data.roomNumber;
    if (data.roomType !== undefined) updatePayload['room_type'] = data.roomType;
    if (data.displayOrder !== undefined) updatePayload['display_order'] = data.displayOrder;
    if (data.status !== undefined) updatePayload['status'] = data.status;

    const row = await this.db
      .updateTable('rooms')
      .set(updatePayload)
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as RoomRow) || null;
  }

  public async updateCapacity(
    id: string,
    organizationId: string,
    newCapacity: number,
    trx?: Transaction<DatabaseSchema>
  ): Promise<RoomRow | null> {
    const executor = trx || this.db;
    const row = await executor
      .updateTable('rooms')
      .set({
        capacity: newCapacity,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as RoomRow) || null;
  }

  public async deleteForOrganization(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('rooms')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return Number(result.numDeletedRows) > 0;
  }

  public async countBedsInRoom(roomId: string, organizationId: string): Promise<number> {
    const res = await this.db
      .selectFrom('beds')
      .select(this.db.fn.count<string>('id').as('cnt'))
      .where('room_id', '=', roomId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirstOrThrow();

    return parseInt(res.cnt, 10);
  }
}
