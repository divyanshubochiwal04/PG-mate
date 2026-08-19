import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type {
  ResidentAdditionalChargeRow,
  ResidentCommercialAgreementRow,
  ResidentFacilityRow,
} from '../schema/commercial.schema';

export interface CommercialRepository {
  findActiveAgreement(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentCommercialAgreementRow | null>;
  findAgreementHistory(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentCommercialAgreementRow[]>;
  findActiveFacilities(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<(ResidentFacilityRow & { facilityName: string; facilityCode: string })[]>;
  findActiveCharges(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentAdditionalChargeRow[]>;
  createAgreement(
    agreement: Omit<ResidentCommercialAgreementRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentCommercialAgreementRow>;
  supersedeActiveAgreement(
    organizationId: string,
    stayId: string,
    endDate: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<void>;
  assignFacility(
    facility: Omit<ResidentFacilityRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentFacilityRow>;
  revokeFacility(
    organizationId: string,
    stayId: string,
    facilityId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<boolean>;
  addAdditionalCharge(
    charge: Omit<ResidentAdditionalChargeRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentAdditionalChargeRow>;
  cancelAdditionalCharge(
    organizationId: string,
    stayId: string,
    chargeId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<boolean>;
}

export class KyselyCommercialRepository implements CommercialRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private getExecutor(trx?: Transaction<DatabaseSchema>) {
    return trx && typeof (trx as unknown as Record<string, unknown>).selectFrom === 'function'
      ? trx
      : this.db;
  }

  public async findActiveAgreement(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentCommercialAgreementRow | null> {
    const row = await this.getExecutor(trx)
      .selectFrom('resident_commercial_agreements')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
    return row || null;
  }

  public async findAgreementHistory(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentCommercialAgreementRow[]> {
    return this.getExecutor(trx)
      .selectFrom('resident_commercial_agreements')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .orderBy('effective_date', 'desc')
      .orderBy('created_at', 'desc')
      .execute();
  }

  public async findActiveFacilities(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<(ResidentFacilityRow & { facilityName: string; facilityCode: string })[]> {
    const rows = await this.getExecutor(trx)
      .selectFrom('resident_facilities')
      .innerJoin('facilities', 'facilities.id', 'resident_facilities.facility_id')
      .select([
        'resident_facilities.id',
        'resident_facilities.organization_id',
        'resident_facilities.resident_id',
        'resident_facilities.stay_id',
        'resident_facilities.facility_id',
        'resident_facilities.facility_type',
        'resident_facilities.monthly_charge',
        'resident_facilities.status',
        'resident_facilities.effective_date',
        'resident_facilities.created_at',
        'resident_facilities.updated_at',
        'facilities.name as facilityName',
        'facilities.code as facilityCode',
      ])
      .where('resident_facilities.organization_id', '=', organizationId)
      .where('resident_facilities.stay_id', '=', stayId)
      .where('resident_facilities.status', '=', 'ACTIVE')
      .execute();
    return rows;
  }

  public async findActiveCharges(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentAdditionalChargeRow[]> {
    return this.getExecutor(trx)
      .selectFrom('resident_additional_charges')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .where('status', '=', 'ACTIVE')
      .execute();
  }

  public async createAgreement(
    agreement: Omit<ResidentCommercialAgreementRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentCommercialAgreementRow> {
    const client = this.getExecutor(trx);
    return client
      .insertInto('resident_commercial_agreements')
      .values(agreement)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async supersedeActiveAgreement(
    organizationId: string,
    stayId: string,
    endDate: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<void> {
    const client = this.getExecutor(trx);
    await client
      .updateTable('resident_commercial_agreements')
      .set({
        status: 'SUPERSEDED',
        end_date: endDate,
        updated_at: new Date(),
      })
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .where('status', '=', 'ACTIVE')
      .execute();
  }

  public async assignFacility(
    facility: Omit<ResidentFacilityRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentFacilityRow> {
    const client = this.getExecutor(trx);
    return client
      .insertInto('resident_facilities')
      .values(facility)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async revokeFacility(
    organizationId: string,
    stayId: string,
    facilityId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<boolean> {
    const client = this.getExecutor(trx);
    const res = await client
      .updateTable('resident_facilities')
      .set({ status: 'REVOKED', updated_at: new Date() })
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .where('facility_id', '=', facilityId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
    return Number(res.numUpdatedRows) > 0;
  }

  public async addAdditionalCharge(
    charge: Omit<ResidentAdditionalChargeRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentAdditionalChargeRow> {
    const client = this.getExecutor(trx);
    return client
      .insertInto('resident_additional_charges')
      .values(charge)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async cancelAdditionalCharge(
    organizationId: string,
    stayId: string,
    chargeId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<boolean> {
    const client = this.getExecutor(trx);
    const res = await client
      .updateTable('resident_additional_charges')
      .set({ status: 'CANCELLED', updated_at: new Date() })
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .where('id', '=', chargeId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
    return Number(res.numUpdatedRows) > 0;
  }
}
