import { useQuery } from '@tanstack/react-query';
import { getOrganizationMeApi } from '../api/org.api';
import type { OrganizationDto } from '@m-square/contracts';

export function useOrganization() {
  return useQuery<OrganizationDto>({
    queryKey: ['organization', 'me'],
    queryFn: getOrganizationMeApi,
    staleTime: 5 * 60 * 1000,
  });
}
