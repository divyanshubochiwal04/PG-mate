import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type { ResidentAdditionalChargeRow, ResidentCommercialAgreementRow, ResidentFacilityRow } from '../schema/commercial.schema';
export interface CommercialRepository {
    findActiveAgreement(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentCommercialAgreementRow | null>;
    findAgreementHistory(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentCommercialAgreementRow[]>;
    findActiveFacilities(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<(ResidentFacilityRow & {
        facilityName: string;
        facilityCode: string;
    })[]>;
    findActiveCharges(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentAdditionalChargeRow[]>;
    createAgreement(agreement: Omit<ResidentCommercialAgreementRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<ResidentCommercialAgreementRow>;
    supersedeActiveAgreement(organizationId: string, stayId: string, endDate: string, trx?: Transaction<DatabaseSchema>): Promise<void>;
    assignFacility(facility: Omit<ResidentFacilityRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<ResidentFacilityRow>;
    revokeFacility(organizationId: string, stayId: string, facilityId: string, trx?: Transaction<DatabaseSchema>): Promise<boolean>;
    addAdditionalCharge(charge: Omit<ResidentAdditionalChargeRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<ResidentAdditionalChargeRow>;
    cancelAdditionalCharge(organizationId: string, stayId: string, chargeId: string, trx?: Transaction<DatabaseSchema>): Promise<boolean>;
}
export declare class KyselyCommercialRepository implements CommercialRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    findActiveAgreement(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentCommercialAgreementRow | null>;
    findAgreementHistory(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentCommercialAgreementRow[]>;
    findActiveFacilities(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<(ResidentFacilityRow & {
        facilityName: string;
        facilityCode: string;
    })[]>;
    findActiveCharges(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentAdditionalChargeRow[]>;
    createAgreement(agreement: Omit<ResidentCommercialAgreementRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<ResidentCommercialAgreementRow>;
    supersedeActiveAgreement(organizationId: string, stayId: string, endDate: string, trx?: Transaction<DatabaseSchema>): Promise<void>;
    assignFacility(facility: Omit<ResidentFacilityRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<ResidentFacilityRow>;
    revokeFacility(organizationId: string, stayId: string, facilityId: string, trx?: Transaction<DatabaseSchema>): Promise<boolean>;
    addAdditionalCharge(charge: Omit<ResidentAdditionalChargeRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<ResidentAdditionalChargeRow>;
    cancelAdditionalCharge(organizationId: string, stayId: string, chargeId: string, trx?: Transaction<DatabaseSchema>): Promise<boolean>;
}
//# sourceMappingURL=commercial.repository.d.ts.map