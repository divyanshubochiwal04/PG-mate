import { useQuery } from '@tanstack/react-query';
import { getOperationalConfigurationSummaryApi } from '../api/configuration.api';

export function useOperationalConfigurationSummary() {
  return useQuery({
    queryKey: ['operational-configuration-summary'],
    queryFn: () => getOperationalConfigurationSummaryApi(),
    staleTime: 30 * 1000,
  });
}
