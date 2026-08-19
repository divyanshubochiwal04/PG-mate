import { apiClient } from '../../../api/client';
import type { OperationalConfigurationSummaryDto } from '@m-square/contracts';

export async function getOperationalConfigurationSummaryApi(): Promise<OperationalConfigurationSummaryDto> {
  const res = await apiClient.get<{ data: OperationalConfigurationSummaryDto }>('/configuration/summary');
  return res.data.data;
}
