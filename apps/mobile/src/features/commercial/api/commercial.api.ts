import { apiClient } from '../../../api/client';
import type {
  AdditionalChargeDto,
  CommercialAgreementDto,
  ResidentCommercialSummaryDto,
  ResidentFacilityDto,
} from '@m-square/contracts';

export interface CreateAgreementRevisionInput {
  baseRentAmount: number;
  securityDepositAmount?: number;
  billingCycle?: 'FIRST_OF_MONTH' | 'JOINING_DATE';
  effectiveDate?: string;
}

export interface AssignResidentFacilityInput {
  facilityId: string;
  facilityType?: 'INCLUDED' | 'PAID' | 'OPTIONAL';
  monthlyCharge?: number;
  effectiveDate?: string;
}

export interface AddAdditionalChargeInput {
  chargeType: 'MAINTENANCE' | 'PARKING' | 'EXTRA_FACILITY' | 'ONE_TIME_FEE' | 'CUSTOM';
  description: string;
  amount: number;
  isRecurring?: boolean;
  effectiveDate?: string;
}

export interface CheckInCommercialInput {
  residentId: string;
  bedId: string;
  admissionDate?: string;
  notes?: string;
  baseRentAmount: number;
  securityDepositAmount?: number;
  billingCycle?: 'FIRST_OF_MONTH' | 'JOINING_DATE';
  facilityIds?: string[];
  additionalCharges?: AddAdditionalChargeInput[];
  messSubscription?: { messId: string; mealPlanId: string };
}

export async function getCommercialSummaryApi(
  residentId: string
): Promise<ResidentCommercialSummaryDto> {
  const res = await apiClient.get<{ data: ResidentCommercialSummaryDto }>(
    `/residents/${residentId}/commercial/summary`
  );
  return res.data.data;
}

export async function getCommercialHistoryApi(
  residentId: string
): Promise<CommercialAgreementDto[]> {
  const res = await apiClient.get<{ data: CommercialAgreementDto[] }>(
    `/residents/${residentId}/commercial/history`
  );
  return res.data.data;
}

export async function createAgreementRevisionApi(
  residentId: string,
  input: CreateAgreementRevisionInput
): Promise<CommercialAgreementDto> {
  const res = await apiClient.post<{ data: CommercialAgreementDto }>(
    `/residents/${residentId}/commercial/agreement`,
    input
  );
  return res.data.data;
}

export async function assignResidentFacilityApi(
  residentId: string,
  input: AssignResidentFacilityInput
): Promise<ResidentFacilityDto> {
  const res = await apiClient.post<{ data: ResidentFacilityDto }>(
    `/residents/${residentId}/commercial/facilities`,
    input
  );
  return res.data.data;
}

export async function revokeResidentFacilityApi(
  residentId: string,
  facilityId: string
): Promise<boolean> {
  const res = await apiClient.delete<{ data: { revoked: boolean } }>(
    `/residents/${residentId}/commercial/facilities/${facilityId}`
  );
  return res.data.data.revoked;
}

export async function addAdditionalChargeApi(
  residentId: string,
  input: AddAdditionalChargeInput
): Promise<AdditionalChargeDto> {
  const res = await apiClient.post<{ data: AdditionalChargeDto }>(
    `/residents/${residentId}/commercial/charges`,
    input
  );
  return res.data.data;
}

export async function cancelAdditionalChargeApi(
  residentId: string,
  chargeId: string
): Promise<boolean> {
  const res = await apiClient.delete<{ data: { cancelled: boolean } }>(
    `/residents/${residentId}/commercial/charges/${chargeId}`
  );
  return res.data.data.cancelled;
}

export async function checkInCommercialApi(input: CheckInCommercialInput) {
  const res = await apiClient.post<{ data: { stay: unknown; allocation: unknown } }>(
    '/check-in/commercial',
    input
  );
  return res.data.data;
}
