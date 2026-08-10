import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';

export interface EmergencyContactRow {
  id: string;
  resident_id: string;
  organization_id: string;
  name: string;
  relationship: string;
  phone: string;
  alternate_phone: string | null;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEmergencyContactData {
  residentId: string;
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string | null;
  isPrimary?: boolean;
}

export interface UpdateEmergencyContactData {
  name?: string;
  relationship?: string;
  phone?: string;
  alternatePhone?: string | null;
  isPrimary?: boolean;
}

export class KyselyEmergencyContactRepository {
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
  ): Promise<EmergencyContactRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('emergency_contacts')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return (row as EmergencyContactRow) || null;
  }

  public async findAllByResident(
    residentId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<EmergencyContactRow[]> {
    const executor = this.getExecutor(trx);
    const rows = await executor
      .selectFrom('emergency_contacts')
      .selectAll()
      .where('resident_id', '=', residentId)
      .where('organization_id', '=', organizationId)
      .orderBy('is_primary', 'desc')
      .orderBy('created_at', 'asc')
      .execute();

    return rows as EmergencyContactRow[];
  }

  public async findPrimaryByResident(
    residentId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<EmergencyContactRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('emergency_contacts')
      .selectAll()
      .where('resident_id', '=', residentId)
      .where('organization_id', '=', organizationId)
      .where('is_primary', '=', true)
      .executeTakeFirst();

    return (row as EmergencyContactRow) || null;
  }

  public async unsetPrimaryForResident(
    residentId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<void> {
    const executor = this.getExecutor(trx);
    await executor
      .updateTable('emergency_contacts')
      .set({ is_primary: false, updated_at: new Date() })
      .where('resident_id', '=', residentId)
      .where('organization_id', '=', organizationId)
      .where('is_primary', '=', true)
      .execute();
  }

  public async createForResident(
    organizationId: string,
    data: CreateEmergencyContactData,
    trx?: Transaction<DatabaseSchema>
  ): Promise<EmergencyContactRow> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .insertInto('emergency_contacts')
      .values({
        resident_id: data.residentId,
        organization_id: organizationId,
        name: data.name,
        relationship: data.relationship,
        phone: data.phone,
        alternate_phone: data.alternatePhone || null,
        is_primary: data.isPrimary ?? true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as EmergencyContactRow;
  }

  public async updateForResident(
    id: string,
    organizationId: string,
    data: UpdateEmergencyContactData,
    trx?: Transaction<DatabaseSchema>
  ): Promise<EmergencyContactRow | null> {
    const executor = this.getExecutor(trx);
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) updatePayload['name'] = data.name;
    if (data.relationship !== undefined) updatePayload['relationship'] = data.relationship;
    if (data.phone !== undefined) updatePayload['phone'] = data.phone;
    if (data.alternatePhone !== undefined) updatePayload['alternate_phone'] = data.alternatePhone;
    if (data.isPrimary !== undefined) updatePayload['is_primary'] = data.isPrimary;

    const row = await executor
      .updateTable('emergency_contacts')
      .set(updatePayload)
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as EmergencyContactRow) || null;
  }

  public async deleteForResident(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<boolean> {
    const executor = this.getExecutor(trx);
    const res = await executor
      .deleteFrom('emergency_contacts')
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return Number(res.numDeletedRows) > 0;
  }
}
