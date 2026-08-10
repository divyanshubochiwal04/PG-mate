import { apiClient } from '../../../api/client';
import type { BuildingDto, PaginatedResult } from '@m-square/contracts';

export interface CreateBuildingInput {
  name: string;
  code: string;
  displayOrder?: number;
}

export async function getBuildingsApi(
  propertyId: string,
  params?: { page?: number; pageSize?: number }
): Promise<PaginatedResult<BuildingDto>> {
  const response = await apiClient.get<{ data: PaginatedResult<BuildingDto> }>(
    `/properties/${propertyId}/buildings`,
    { params }
  );
  return response.data.data;
}

export async function getBuildingByIdApi(id: string): Promise<BuildingDto> {
  const response = await apiClient.get<{ data: BuildingDto }>(`/buildings/${id}`);
  return response.data.data;
}

export async function createBuildingApi(
  propertyId: string,
  data: CreateBuildingInput
): Promise<BuildingDto> {
  const response = await apiClient.post<{ data: BuildingDto }>(`/properties/${propertyId}/buildings`, data);
  return response.data.data;
}
