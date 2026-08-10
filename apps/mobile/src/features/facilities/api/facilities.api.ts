import { apiClient } from '../../../api/client';
import type { FacilityDto, PaginatedResult } from '@m-square/contracts';

export interface CreateFacilityInput {
  name: string;
  code: string;
  category?: 'GENERAL' | 'UTILITY' | 'SAFETY' | 'COMFORT';
  description?: string;
}

export async function getFacilitiesApi(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<FacilityDto>> {
  const response = await apiClient.get<{ data: PaginatedResult<FacilityDto> }>('/facilities', { params });
  return response.data.data;
}

export async function createFacilityApi(data: CreateFacilityInput): Promise<FacilityDto> {
  const response = await apiClient.post<{ data: FacilityDto }>('/facilities', data);
  return response.data.data;
}

export async function assignFacilityToPropertyApi(
  propertyId: string,
  facilityId: string
): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ data: { success: boolean } }>(
    `/properties/${propertyId}/facilities/${facilityId}`
  );
  return response.data.data;
}

export async function unassignFacilityFromPropertyApi(
  propertyId: string,
  facilityId: string
): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ data: { success: boolean } }>(
    `/properties/${propertyId}/facilities/${facilityId}`
  );
  return response.data.data;
}

export async function assignFacilityToBuildingApi(
  buildingId: string,
  facilityId: string
): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ data: { success: boolean } }>(
    `/buildings/${buildingId}/facilities/${facilityId}`
  );
  return response.data.data;
}

export async function unassignFacilityFromBuildingApi(
  buildingId: string,
  facilityId: string
): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ data: { success: boolean } }>(
    `/buildings/${buildingId}/facilities/${facilityId}`
  );
  return response.data.data;
}

export async function assignFacilityToRoomApi(
  roomId: string,
  facilityId: string
): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ data: { success: boolean } }>(
    `/rooms/${roomId}/facilities/${facilityId}`
  );
  return response.data.data;
}

export async function unassignFacilityFromRoomApi(
  roomId: string,
  facilityId: string
): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ data: { success: boolean } }>(
    `/rooms/${roomId}/facilities/${facilityId}`
  );
  return response.data.data;
}
