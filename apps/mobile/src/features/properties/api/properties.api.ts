import { apiClient } from '../../../api/client';
import type { PaginatedResult, PropertyDto } from '@m-square/contracts';

export interface CreatePropertyInput {
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface UpdatePropertyInput {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export async function getPropertiesApi(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<PropertyDto>> {
  const response = await apiClient.get<{ data: PaginatedResult<PropertyDto> }>('/properties', {
    params,
  });
  return response.data.data;
}

export async function getPropertyByIdApi(id: string): Promise<PropertyDto> {
  const response = await apiClient.get<{ data: PropertyDto }>(`/properties/${id}`);
  return response.data.data;
}

export async function createPropertyApi(data: CreatePropertyInput): Promise<PropertyDto> {
  const response = await apiClient.post<{ data: PropertyDto }>('/properties', data);
  return response.data.data;
}

export async function updatePropertyApi(
  id: string,
  data: UpdatePropertyInput
): Promise<PropertyDto> {
  const response = await apiClient.put<{ data: PropertyDto }>(`/properties/${id}`, data);
  return response.data.data;
}

export async function deletePropertyApi(id: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ data: { success: boolean } }>(`/properties/${id}`);
  return response.data.data;
}
