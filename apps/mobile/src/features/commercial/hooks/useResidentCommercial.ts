import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { getCommercialHistoryApi, getCommercialSummaryApi } from '../api/commercial.api';

export function useResidentCommercial(residentId: string | undefined) {
  const { user } = useAuth();
  const orgId = user?.organizationId || 'unauthenticated';

  const summaryQuery = useQuery({
    queryKey: ['resident-commercial', orgId, residentId],
    queryFn: () => (residentId ? getCommercialSummaryApi(residentId) : null),
    enabled: !!residentId && !!user?.organizationId,
  });

  const historyQuery = useQuery({
    queryKey: ['resident-commercial-history', orgId, residentId],
    queryFn: () => (residentId ? getCommercialHistoryApi(residentId) : null),
    enabled: !!residentId && !!user?.organizationId,
  });

  return {
    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    summaryError: summaryQuery.error,
    refetchSummary: summaryQuery.refetch,
    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    refetchHistory: historyQuery.refetch,
  };
}
