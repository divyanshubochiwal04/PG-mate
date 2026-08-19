import { apiClient } from '../../../api/client';
import type { OrganizationDto } from '@m-square/contracts';

export async function getOrganizationMeApi(): Promise<OrganizationDto> {
  const response = await apiClient.get<{ data: OrganizationDto }>('/organizations/me');
  return response.data.data;
}
