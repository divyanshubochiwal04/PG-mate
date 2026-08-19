import { apiClient } from '../../../api/client';
import type { BedDto, PaginatedResult } from '@m-square/contracts';

export interface CreateBedInput {
  bedNumber: string;
  displayOrder?: number;
}

export interface UpdateBedInput {
  bedNumber?: string;
  displayOrder?: number;
  status?: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE';
}

export async function getBedsApi(
  roomId: string,
  params?: { page?: number; pageSize?: number }
): Promise<PaginatedResult<BedDto>> {
  const response = await apiClient.get<{ data: PaginatedResult<BedDto> }>(`/rooms/${roomId}/beds`, {
    params,
  });
  return response.data.data;
}

export async function getBedByIdApi(id: string): Promise<BedDto> {
  const response = await apiClient.get<{ data: BedDto }>(`/beds/${id}`);
  return response.data.data;
}

export async function createBedApi(roomId: string, data: CreateBedInput): Promise<BedDto> {
  const response = await apiClient.post<{ data: BedDto }>(`/rooms/${roomId}/beds`, data);
  return response.data.data;
}

export async function updateBedStatusApi(
  id: string,
  status: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE'
): Promise<BedDto> {
  const response = await apiClient.patch<{ data: BedDto }>(`/beds/${id}/status`, { status });
  return response.data.data;
}

export async function updateBedApi(id: string, data: UpdateBedInput): Promise<BedDto> {
  const response = await apiClient.put<{ data: BedDto }>(`/beds/${id}`, data);
  return response.data.data;
}

export async function deleteBedApi(id: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ data: { success: boolean } }>(`/beds/${id}`);
  return response.data.data;
}
