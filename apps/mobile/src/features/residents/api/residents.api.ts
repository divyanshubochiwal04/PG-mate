import { apiClient } from '../../../api/client';
import type {
  BedAllocationDto,
  EmergencyContactDto,
  EmergencyRelationship,
  Gender,
  PaginatedResult,
  ResidentDto,
  ResidentHistoryDto,
  ResidentOperationalListResponseDto,
  ResidentOperationalQueryPayload,
  ResidentOperationalSummaryDto,
  StayDto,
} from '@m-square/contracts';

export interface CreateResidentInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth?: string;
  gender: Gender;
  phone: string;
  alternatePhone?: string;
  email?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface UpdateResidentInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  preferredName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  emergencyContact?: {
    name?: string;
    relationship?: EmergencyRelationship;
    phone?: string;
    alternatePhone?: string;
  };
}

export interface CreateEmergencyContactInput {
  name: string;
  relationship: EmergencyRelationship;
  phone: string;
  alternatePhone?: string;
  isPrimary?: boolean;
}

export interface CheckInInput {
  residentId: string;
  bedId: string;
  admissionDate?: string;
  expectedCheckoutDate?: string;
  notes?: string;
}

export interface TransferInput {
  targetBedId: string;
  transferDate?: string;
  notes?: string;
}

export interface CheckOutInput {
  actualCheckoutDate?: string;
  checkoutDate?: string;
  notes?: string;
}

export async function getResidentsApi(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<ResidentDto>> {
  const response = await apiClient.get<{ data: PaginatedResult<ResidentDto> }>('/residents', {
    params,
  });
  return response.data.data;
}

export async function getResidentByIdApi(id: string): Promise<ResidentDto> {
  const response = await apiClient.get<{ data: ResidentDto }>(`/residents/${id}`);
  return response.data.data;
}

export async function createResidentApi(data: CreateResidentInput): Promise<ResidentDto> {
  const response = await apiClient.post<{ data: ResidentDto }>('/residents', data);
  return response.data.data;
}

export async function updateResidentApi(
  id: string,
  data: UpdateResidentInput
): Promise<ResidentDto> {
  const response = await apiClient.patch<{ data: ResidentDto }>(`/residents/${id}`, data);
  return response.data.data;
}

export async function getResidentHistoryApi(id: string): Promise<ResidentHistoryDto> {
  const response = await apiClient.get<{ data: ResidentHistoryDto }>(`/residents/${id}/history`);
  return response.data.data;
}

export interface UpdateEmergencyContactInput {
  name?: string;
  relationship?: EmergencyRelationship;
  phone?: string;
  alternatePhone?: string;
  isPrimary?: boolean;
}

export async function createEmergencyContactApi(
  residentId: string,
  data: CreateEmergencyContactInput
): Promise<EmergencyContactDto> {
  const response = await apiClient.post<{ data: EmergencyContactDto }>(
    `/residents/${residentId}/emergency-contacts`,
    data
  );
  return response.data.data;
}

export async function getEmergencyContactsApi(residentId: string): Promise<EmergencyContactDto[]> {
  const response = await apiClient.get<{ data: EmergencyContactDto[] }>(
    `/residents/${residentId}/emergency-contacts`
  );
  return response.data.data;
}

export async function updateEmergencyContactApi(
  residentId: string,
  contactId: string,
  data: UpdateEmergencyContactInput
): Promise<EmergencyContactDto> {
  const response = await apiClient.patch<{ data: EmergencyContactDto }>(
    `/residents/${residentId}/emergency-contacts/${contactId}`,
    data
  );
  return response.data.data;
}

export async function deleteEmergencyContactApi(
  residentId: string,
  contactId: string
): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ data: { success: boolean } }>(
    `/residents/${residentId}/emergency-contacts/${contactId}`
  );
  return response.data.data;
}

export async function checkInApi(
  data: CheckInInput
): Promise<{ stay: StayDto; allocation: BedAllocationDto }> {
  const response = await apiClient.post<{ data: { stay: StayDto; allocation: BedAllocationDto } }>(
    '/check-in',
    data
  );
  return response.data.data;
}

export async function transferBedApi(
  allocationId: string,
  data: TransferInput
): Promise<BedAllocationDto> {
  const response = await apiClient.post<{ data: BedAllocationDto }>(
    `/allocations/${allocationId}/transfer`,
    data
  );
  return response.data.data;
}

export async function checkOutApi(stayId: string, data: CheckOutInput): Promise<StayDto> {
  const response = await apiClient.post<{ data: StayDto }>(`/stays/${stayId}/check-out`, data);
  return response.data.data;
}

export async function checkOutResidentApi(residentId: string, data: CheckOutInput): Promise<StayDto> {
  const response = await apiClient.post<{ data: StayDto }>(`/residents/${residentId}/check-out`, data);
  return response.data.data;
}

export async function getOperationalResidentsApi(
  params?: ResidentOperationalQueryPayload
): Promise<ResidentOperationalListResponseDto> {
  const response = await apiClient.get<{ data: ResidentOperationalListResponseDto }>(
    '/residents/operational',
    { params }
  );
  return response.data.data;
}

export async function getOperationalSummaryApi(): Promise<ResidentOperationalSummaryDto> {
  const response = await apiClient.get<{ data: ResidentOperationalSummaryDto }>('/residents/summary');
  return response.data.data;
}
