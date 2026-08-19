export type SecurityDepositStatus = 'PENDING' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FORFEITED';
export type BillingCycle = 'FIRST_OF_MONTH' | 'JOINING_DATE';
export type CommercialAgreementStatus = 'ACTIVE' | 'SUPERSEDED' | 'TERMINATED';
export type ResidentFacilityType = 'INCLUDED' | 'PAID' | 'OPTIONAL';
export type ResidentFacilityStatus = 'ACTIVE' | 'REVOKED';
export type AdditionalChargeType = 'MAINTENANCE' | 'PARKING' | 'EXTRA_FACILITY' | 'ONE_TIME_FEE' | 'CUSTOM';
export type AdditionalChargeStatus = 'ACTIVE' | 'CANCELLED';
export interface CommercialAgreementDto {
    id: string;
    organizationId: string;
    residentId: string;
    stayId: string;
    baseRentAmount: number;
    securityDepositAmount: number;
    securityDepositStatus: SecurityDepositStatus;
    billingCycle: BillingCycle;
    effectiveDate: string;
    endDate: string | null;
    status: CommercialAgreementStatus;
    createdAt: string;
}
export interface ResidentFacilityDto {
    id: string;
    organizationId: string;
    residentId: string;
    stayId: string;
    facilityId: string;
    facilityName: string;
    facilityCode: string;
    facilityType: ResidentFacilityType;
    monthlyCharge: number;
    status: ResidentFacilityStatus;
    effectiveDate: string;
    createdAt: string;
}
export interface AdditionalChargeDto {
    id: string;
    organizationId: string;
    residentId: string;
    stayId: string;
    agreementId: string | null;
    chargeType: AdditionalChargeType;
    description: string;
    amount: number;
    isRecurring: boolean;
    effectiveDate: string;
    status: AdditionalChargeStatus;
    createdAt: string;
}
export interface ResidentCommercialSummaryDto {
    agreement: CommercialAgreementDto | null;
    facilities: ResidentFacilityDto[];
    additionalCharges: AdditionalChargeDto[];
    totalMonthlyAmount: number;
}
//# sourceMappingURL=commercial.contract.d.ts.map