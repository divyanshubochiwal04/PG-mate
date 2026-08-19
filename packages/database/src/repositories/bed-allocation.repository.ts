import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';

export interface BedAllocationRow {
  id: string;
  organization_id: string;
  stay_id: string;
  bed_id: string;
  start_at: Date;
  end_at: Date | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAllocationData {
  stayId: string;
  bedId: string;
  startAt?: Date;
  status?: string;
}

export interface DetailedCurrentLocation {
  propertyId: string;
  propertyName: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  roomId: string;
  roomNumber: string;
  bedId: string;
  bedNumber: string;
  allocationId: string;
  stayId: string;
}

export class KyselyBedAllocationRepository {
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
  ): Promise<BedAllocationRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('bed_allocations')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return (row as BedAllocationRow) || null;
  }

  public async findByIdForUpdate(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedAllocationRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('bed_allocations')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .forUpdate()
      .executeTakeFirst();

    return (row as BedAllocationRow) || null;
  }

  public async findActiveByBed(
    bedId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedAllocationRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('bed_allocations')
      .selectAll()
      .where('bed_id', '=', bedId)
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();

    return (row as BedAllocationRow) || null;
  }

  public async findActiveByStay(
    stayId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedAllocationRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('bed_allocations')
      .selectAll()
      .where('stay_id', '=', stayId)
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();

    return (row as BedAllocationRow) || null;
  }

  public async findAllByStay(
    stayId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedAllocationRow[]> {
    const executor = this.getExecutor(trx);
    const rows = await executor
      .selectFrom('bed_allocations')
      .selectAll()
      .where('stay_id', '=', stayId)
      .where('organization_id', '=', organizationId)
      .orderBy('start_at', 'desc')
      .execute();

    return rows as BedAllocationRow[];
  }

  public async findCurrentLocationForResident(
    residentId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<DetailedCurrentLocation | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('stays as s')
      .innerJoin('bed_allocations as ba', (join) =>
        join.onRef('ba.stay_id', '=', 's.id').on('ba.status', '=', 'ACTIVE')
      )
      .innerJoin('beds as b', 'b.id', 'ba.bed_id')
      .innerJoin('rooms as r', 'r.id', 'b.room_id')
      .innerJoin('floors as f', 'f.id', 'r.floor_id')
      .innerJoin('buildings as bldg', 'bldg.id', 'f.building_id')
      .innerJoin('properties as p', 'p.id', 'bldg.property_id')
      .select([
        'p.id as propertyId',
        'p.name as propertyName',
        'bldg.id as buildingId',
        'bldg.name as buildingName',
        'f.id as floorId',
        'f.name as floorName',
        'r.id as roomId',
        'r.room_number as roomNumber',
        'b.id as bedId',
        'b.bed_number as bedNumber',
        'ba.id as allocationId',
        's.id as stayId',
      ])
      .where('s.resident_id', '=', residentId)
      .where('s.organization_id', '=', organizationId)
      .where('s.status', '=', 'ACTIVE')
      .executeTakeFirst();

    return (row as DetailedCurrentLocation) || null;
  }

  public async createForOrganization(
    organizationId: string,
    data: CreateAllocationData,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedAllocationRow> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .insertInto('bed_allocations')
      .values({
        organization_id: organizationId,
        stay_id: data.stayId,
        bed_id: data.bedId,
        start_at: data.startAt || new Date(),
        end_at: null,
        status: data.status || 'ACTIVE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as BedAllocationRow;
  }

  public async endAllocation(
    id: string,
    organizationId: string,
    endAt?: Date,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BedAllocationRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .updateTable('bed_allocations')
      .set({
        status: 'ENDED',
        end_at: endAt || new Date(),
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as BedAllocationRow) || null;
  }
}
