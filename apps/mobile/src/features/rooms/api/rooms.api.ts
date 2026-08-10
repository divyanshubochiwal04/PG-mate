import { apiClient } from '../../../api/client';
import type { PaginatedResult, RoomDto } from '@m-square/contracts';

export interface CreateRoomInput {
  roomNumber: string;
  roomType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY' | 'CUSTOM';
  capacity: number;
  displayOrder?: number;
}

export async function getRoomsApi(
  floorId: string,
  params?: { page?: number; pageSize?: number }
): Promise<PaginatedResult<RoomDto>> {
  const response = await apiClient.get<{ data: PaginatedResult<RoomDto> }>(`/floors/${floorId}/rooms`, {
    params,
  });
  return response.data.data;
}

export async function getRoomByIdApi(id: string): Promise<RoomDto> {
  const response = await apiClient.get<{ data: RoomDto }>(`/rooms/${id}`);
  return response.data.data;
}

export async function createRoomApi(floorId: string, data: CreateRoomInput): Promise<RoomDto> {
  const response = await apiClient.post<{ data: RoomDto }>(`/floors/${floorId}/rooms`, data);
  return response.data.data;
}

export async function updateRoomCapacityApi(id: string, capacity: number): Promise<RoomDto> {
  const response = await apiClient.patch<{ data: RoomDto }>(`/rooms/${id}/capacity`, { capacity });
  return response.data.data;
}
