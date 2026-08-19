import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { PaginatedResult, PaginationParams } from '@m-square/contracts';
import { calculatePaginationBounds, createPaginatedResult } from '@m-square/contracts';
import { KyselyResidentOperationalRepository } from './resident-operational.repository';

export interface ResidentRow {
  id: string;
  organization_id: string;
  resident_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  preferred_name: string | null;
  date_of_birth: Date | null;
  gender: string;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateResidentData {
  residentCode: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  preferredName?: string | null;
  dateOfBirth?: Date | null;
  gender: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  status?: string;
}

export interface UpdateResidentData {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  preferredName?: string | null;
  dateOfBirth?: Date | null;
  gender?: string;
  phone?: string;
  alternatePhone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  status?: string;
}

import type {
  ResidentOperationalListItemDto,
  ResidentOperationalListResponseDto,
  ResidentOperationalQueryPayload,
  ResidentOperationalSummaryDto,
  ResidentStatus,
  StayStatus,
} from '@m-square/contracts';
import { sql } from 'kysely';

export class KyselyResidentRepository {
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
  ): Promise<ResidentRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('residents')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    return (row as ResidentRow) || null;
  }

  public async findByIdForUpdate(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('residents')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .forUpdate()
      .executeTakeFirst();

    return (row as ResidentRow) || null;
  }

  public async findAllForOrganization(
    organizationId: string,
    params: PaginationParams,
    search?: string,
    status?: string
  ): Promise<PaginatedResult<ResidentRow>> {
    const { offset, limit } = calculatePaginationBounds(params.page, params.pageSize);

    let query = this.db
      .selectFrom('residents')
      .selectAll()
      .where('organization_id', '=', organizationId);

    let countQuery = this.db
      .selectFrom('residents')
      .select(this.db.fn.count<string>('id').as('total'))
      .where('organization_id', '=', organizationId);

    if (search && search.trim().length > 0) {
      const term = `%${search.trim().toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb('first_name', 'ilike', term),
          eb('last_name', 'ilike', term),
          eb('resident_code', 'ilike', term),
          eb('phone', 'ilike', term),
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('first_name', 'ilike', term),
          eb('last_name', 'ilike', term),
          eb('resident_code', 'ilike', term),
          eb('phone', 'ilike', term),
        ])
      );
    }

    if (status && status.trim().length > 0) {
      query = query.where('status', '=', status.trim());
      countQuery = countQuery.where('status', '=', status.trim());
    }

    const countResult = await countQuery.executeTakeFirstOrThrow();
    const total = parseInt(countResult.total, 10);

    const rows = await query.orderBy('created_at', 'desc').offset(offset).limit(limit).execute();

    return createPaginatedResult(rows as ResidentRow[], total, params.page, params.pageSize);
  }

  public async findOperationalList(
    organizationId: string,
    params: ResidentOperationalQueryPayload
  ): Promise<ResidentOperationalListResponseDto> {
    const opRepo = new KyselyResidentOperationalRepository(this.db);
    return opRepo.findOperationalList(organizationId, params);
  }

  public async getOperationalSummary(organizationId: string): Promise<ResidentOperationalSummaryDto> {
    const opRepo = new KyselyResidentOperationalRepository(this.db);
    return opRepo.getOperationalSummary(organizationId);
  }

  public async createForOrganization(
    organizationId: string,
    data: CreateResidentData,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentRow> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .insertInto('residents')
      .values({
        organization_id: organizationId,
        resident_code: data.residentCode,
        first_name: data.firstName,
        middle_name: data.middleName || null,
        last_name: data.lastName,
        preferred_name: data.preferredName || null,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender,
        phone: data.phone,
        alternate_phone: data.alternatePhone || null,
        email: data.email || null,
        address_line1: data.addressLine1 || null,
        city: data.city || null,
        state: data.state || null,
        postal_code: data.postalCode || null,
        status: data.status || 'ACTIVE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as ResidentRow;
  }

  public async updateForOrganization(
    id: string,
    organizationId: string,
    data: UpdateResidentData,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentRow | null> {
    const executor = this.getExecutor(trx);
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (data.firstName !== undefined) updatePayload['first_name'] = data.firstName;
    if (data.middleName !== undefined) updatePayload['middle_name'] = data.middleName;
    if (data.lastName !== undefined) updatePayload['last_name'] = data.lastName;
    if (data.preferredName !== undefined) updatePayload['preferred_name'] = data.preferredName;
    if (data.dateOfBirth !== undefined) updatePayload['date_of_birth'] = data.dateOfBirth;
    if (data.gender !== undefined) updatePayload['gender'] = data.gender;
    if (data.phone !== undefined) updatePayload['phone'] = data.phone;
    if (data.alternatePhone !== undefined) updatePayload['alternate_phone'] = data.alternatePhone;
    if (data.email !== undefined) updatePayload['email'] = data.email;
    if (data.addressLine1 !== undefined) updatePayload['address_line1'] = data.addressLine1;
    if (data.city !== undefined) updatePayload['city'] = data.city;
    if (data.state !== undefined) updatePayload['state'] = data.state;
    if (data.postalCode !== undefined) updatePayload['postal_code'] = data.postalCode;
    if (data.status !== undefined) updatePayload['status'] = data.status;

    const row = await executor
      .updateTable('residents')
      .set(updatePayload)
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();

    return (row as ResidentRow) || null;
  }
}
