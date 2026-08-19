import type { ColumnType, Generated, Selectable } from 'kysely';
export type SecurityDepositStatus = 'PENDING' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FORFEITED';
export type BillingCycle = 'FIRST_OF_MONTH' | 'JOINING_DATE';
export type CommercialAgreementStatus = 'ACTIVE' | 'SUPERSEDED' | 'TERMINATED';
export type ResidentFacilityType = 'INCLUDED' | 'PAID' | 'OPTIONAL';
export type ResidentFacilityStatus = 'ACTIVE' | 'REVOKED';
export type AdditionalChargeType = 'MAINTENANCE' | 'PARKING' | 'EXTRA_FACILITY' | 'ONE_TIME_FEE' | 'CUSTOM';
export type AdditionalChargeStatus = 'ACTIVE' | 'CANCELLED';
export interface ResidentCommercialAgreementsTable {
    id: Generated<string>;
    organization_id: string;
    resident_id: string;
    stay_id: string;
    base_rent_amount: ColumnType<number, number | string, number | string>;
    security_deposit_amount: ColumnType<number, number | string, number | string>;
    security_deposit_status: SecurityDepositStatus;
    billing_cycle: BillingCycle;
    effective_date: ColumnType<string, string, string>;
    end_date: ColumnType<string | null, string | null, string | null>;
    status: CommercialAgreementStatus;
    created_at: ColumnType<Date, string | Date | undefined, never>;
    updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}
export interface ResidentFacilitiesTable {
    id: Generated<string>;
    organization_id: string;
    resident_id: string;
    stay_id: string;
    facility_id: string;
    facility_type: ResidentFacilityType;
    monthly_charge: ColumnType<number, number | string, number | string>;
    status: ResidentFacilityStatus;
    effective_date: ColumnType<string, string, string>;
    created_at: ColumnType<Date, string | Date | undefined, never>;
    updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}
export interface ResidentAdditionalChargesTable {
    id: Generated<string>;
    organization_id: string;
    resident_id: string;
    stay_id: string;
    agreement_id: string | null;
    charge_type: AdditionalChargeType;
    description: string;
    amount: ColumnType<number, number | string, number | string>;
    is_recurring: boolean;
    effective_date: ColumnType<string, string, string>;
    status: AdditionalChargeStatus;
    created_at: ColumnType<Date, string | Date | undefined, never>;
    updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}
export type ResidentCommercialAgreementRow = Selectable<ResidentCommercialAgreementsTable>;
export type ResidentFacilityRow = Selectable<ResidentFacilitiesTable>;
export type ResidentAdditionalChargeRow = Selectable<ResidentAdditionalChargesTable>;
//# sourceMappingURL=commercial.schema.d.ts.map