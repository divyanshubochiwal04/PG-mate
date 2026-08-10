import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';

export interface StayRow {
  id: string;
  organization_id: string;
  resident_id: string;
  admission_date: Date;
  expected_checkout_date: Date | null;
  actual_checkout_date: Date | null;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateStayData {
  residentId: string;
  admissionDate?: Date;
  expectedCheckoutDate?: Date | null;
  notes?: string | null;
  status?: string;
}

export class KyselyStayRepository {
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
  ): Promise<StayRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('stays')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return (row as StayRow) || null;
  }

  public async findByIdForUpdate(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<StayRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('stays')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .forUpdate()
      .executeTakeFirst();

    return (row as StayRow) || null;
  }

  public async findActiveByResident(
    residentId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<StayRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('stays')
      .selectAll()
      .where('resident_id', '=', residentId)
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();

    return (row as StayRow) || null;
  }

  public async findAllByResident(
    residentId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<StayRow[]> {
    const executor = this.getExecutor(trx);
    const rows = await executor
      .selectFrom('stays')
      .selectAll()
      .where('resident_id', '=', residentId)
      .where('organization_id', '=', organizationId)
      .orderBy('admission_date', 'desc')
      .execute();

    return rows as StayRow[];
  }

  public async createForOrganization(
    organizationId: string,
    data: CreateStayData,
    trx?: Transaction<DatabaseSchema>
  ): Promise<StayRow> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .insertInto('stays')
      .values({
        organization_id: organizationId,
        resident_id: data.residentId,
        admission_date: data.admissionDate || new Date(),
        expected_checkout_date: data.expectedCheckoutDate || null,
        actual_checkout_date: null,
        status: data.status || 'ACTIVE',
        notes: data.notes || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as StayRow;
  }

  public async completeStay(
    id: string,
    organizationId: string,
    actualCheckoutDate?: Date,
    notes?: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<StayRow | null> {
    const executor = this.getExecutor(trx);
    const updatePayload: Record<string, unknown> = {
      status: 'COMPLETED',
      actual_checkout_date: actualCheckoutDate || new Date(),
      updated_at: new Date(),
    };
    if (notes !== undefined) updatePayload['notes'] = notes;

    const row = await executor
      .updateTable('stays')
      .set(updatePayload)
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as StayRow) || null;
  }
}
