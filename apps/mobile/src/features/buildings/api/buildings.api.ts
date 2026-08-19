import { apiClient } from '../../../api/client';
import type {
  BuildingDto,
  BuildingOccupancyTreeDto,
  BuildingSetupResultDto,
  CreateBuildingSetupDataDto,
  PaginatedResult,
} from '@m-square/contracts';

export interface CreateBuildingInput {
  name: string;
  code: string;
  displayOrder?: number;
}

export interface UpdateBuildingInput {
  name?: string;
  code?: string;
  displayOrder?: number;
  status?: 'ACTIVE' | 'INACTIVE';
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

export async function getBuildingOccupancyTreeApi(
  buildingId: string
): Promise<BuildingOccupancyTreeDto> {
  const response = await apiClient.get<{ data: BuildingOccupancyTreeDto }>(
    `/buildings/${buildingId}/tree`
  );
  return response.data.data;
}

export async function createBuildingApi(
  propertyId: string,
  data: CreateBuildingInput
): Promise<BuildingDto> {
  const response = await apiClient.post<{ data: BuildingDto }>(
    `/properties/${propertyId}/buildings`,
    data
  );
  return response.data.data;
}

export async function createBuildingSetupApi(
  data: CreateBuildingSetupDataDto
): Promise<BuildingSetupResultDto> {
  const response = await apiClient.post<{ data: BuildingSetupResultDto }>(`/buildings/setup`, data);
  return response.data.data;
}

export async function updateBuildingApi(
  id: string,
  data: UpdateBuildingInput
): Promise<BuildingDto> {
  const response = await apiClient.put<{ data: BuildingDto }>(`/buildings/${id}`, data);
  return response.data.data;
}

export async function deleteBuildingApi(id: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ data: { success: boolean } }>(`/buildings/${id}`);
  return response.data.data;
}
