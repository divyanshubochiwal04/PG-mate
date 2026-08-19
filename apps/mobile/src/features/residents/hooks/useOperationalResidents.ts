import { useQuery } from '@tanstack/react-query';
import type {
  ResidentOperationalListResponseDto,
  ResidentOperationalQueryPayload,
  ResidentOperationalSummaryDto,
} from '@m-square/contracts';
import {
  getOperationalResidentsApi,
  getOperationalSummaryApi,
} from '../api/residents.api';

export function useOperationalResidents(params: ResidentOperationalQueryPayload) {
  return useQuery<ResidentOperationalListResponseDto>({
    queryKey: ['residents', 'operational', params],
    queryFn: () => getOperationalResidentsApi(params),
  });
}

export function useOperationalSummary() {
  return useQuery<ResidentOperationalSummaryDto>({
    queryKey: ['residents', 'summary'],
    queryFn: () => getOperationalSummaryApi(),
  });
}
