import { apiClient } from '../../../api/client';
import type { FloorDto, PaginatedResult } from '@m-square/contracts';

export interface CreateFloorInput {
  name: string;
  floorNumber: number;
  displayOrder?: number;
}

export async function getFloorsApi(
  buildingId: string,
  params?: { page?: number; pageSize?: number }
): Promise<PaginatedResult<FloorDto>> {
  const response = await apiClient.get<{ data: PaginatedResult<FloorDto> }>(
    `/buildings/${buildingId}/floors`,
    { params }
  );
  return response.data.data;
}

export async function getFloorByIdApi(id: string): Promise<FloorDto> {
  const response = await apiClient.get<{ data: FloorDto }>(`/floors/${id}`);
  return response.data.data;
}

export async function createFloorApi(
  buildingId: string,
  data: CreateFloorInput
): Promise<FloorDto> {
  const response = await apiClient.post<{ data: FloorDto }>(`/buildings/${buildingId}/floors`, data);
  return response.data.data;
}
