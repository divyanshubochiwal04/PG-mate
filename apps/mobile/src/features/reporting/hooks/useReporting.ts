import { useQuery } from '@tanstack/react-query';
import {
  getActivityReportApi,
  getBillingReportApi,
  getBillingReportDetailedApi,
  getCollectionReportDetailedApi,
  getDashboardOverviewApi,
  getExpenseReportApi,
  getExpenseReportDetailedApi,
  getInventoryReportDetailedApi,
  getMessReportApi,
  getMessReportDetailedApi,
  getOccupancyReportApi,
  getOccupancyReportDetailedApi,
  getOperationalAlertsApi,
  getOutstandingReportDetailedApi,
  getProcurementReportDetailedApi,
  getPropertyPerformanceReportDetailedApi,
  getResidentReportApi,
  getResidentReportDetailedApi,
  type ReportQueryParams,
} from '../api/reporting.api';
import { usePropertyContext } from '../../../context/property-context';

export function useDashboardOverview(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: [
      'owner-dashboard-summary',
      effectivePropertyId || 'ALL',
      params?.buildingId || 'ALL',
      params?.period || 'CURRENT',
      params?.preset || 'THIS_MONTH',
      params?.startDate || '',
      params?.endDate || '',
    ],
    queryFn: () =>
      getDashboardOverviewApi({
        ...params,
        propertyId: effectivePropertyId,
      }),
    staleTime: 30 * 1000,
  });
}

export function useOperationalAlerts(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: [
      'owner-dashboard-alerts',
      effectivePropertyId || 'ALL',
      params?.buildingId || 'ALL',
    ],
    queryFn: () =>
      getOperationalAlertsApi({
        ...params,
        propertyId: effectivePropertyId,
      }),
    staleTime: 30 * 1000,
  });
}

export function useOccupancyReport(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: [
      'reporting-occupancy',
      effectivePropertyId || 'ALL',
      params?.buildingId || 'ALL',
    ],
    queryFn: () =>
      getOccupancyReportApi({
        ...params,
        propertyId: effectivePropertyId,
      }),
    staleTime: 30 * 1000,
  });
}

export function useResidentReport(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: [
      'reporting-residents',
      effectivePropertyId || 'ALL',
      params?.buildingId || 'ALL',
      params?.startDate || '',
      params?.endDate || '',
    ],
    queryFn: () =>
      getResidentReportApi({
        ...params,
        propertyId: effectivePropertyId,
      }),
    staleTime: 30 * 1000,
  });
}

export function useBillingReport(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: [
      'reporting-billing',
      effectivePropertyId || 'ALL',
      params?.buildingId || 'ALL',
      params?.startDate || '',
      params?.endDate || '',
    ],
    queryFn: () =>
      getBillingReportApi({
        ...params,
        propertyId: effectivePropertyId,
      }),
    staleTime: 30 * 1000,
  });
}

export function useMessReport(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: [
      'reporting-mess',
      effectivePropertyId || 'ALL',
      params?.buildingId || 'ALL',
      params?.startDate || '',
      params?.endDate || '',
    ],
    queryFn: () =>
      getMessReportApi({
        ...params,
        propertyId: effectivePropertyId,
      }),
    staleTime: 30 * 1000,
  });
}

export function useExpenseReport(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: [
      'reporting-expenses',
      effectivePropertyId || 'ALL',
      params?.buildingId || 'ALL',
      params?.startDate || '',
      params?.endDate || '',
    ],
    queryFn: () =>
      getExpenseReportApi({
        ...params,
        propertyId: effectivePropertyId,
      }),
    staleTime: 30 * 1000,
  });
}

export function useActivityReport(params?: ReportQueryParams & { limit?: number }) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: [
      'reporting-activity',
      effectivePropertyId || 'ALL',
      params?.buildingId || 'ALL',
      params?.limit || 20,
    ],
    queryFn: () =>
      getActivityReportApi({
        ...params,
        propertyId: effectivePropertyId,
      }),
    staleTime: 30 * 1000,
  });
}

// --- STEP 19 DETAILED REPORT HOOKS ---

export function useResidentReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'residents', effectivePropertyId || 'ALL', params?.buildingId || 'ALL', params?.search || '', params?.page || 1],
    queryFn: () => getResidentReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}

export function useOccupancyReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'occupancy', effectivePropertyId || 'ALL', params?.buildingId || 'ALL'],
    queryFn: () => getOccupancyReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}

export function useBillingReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'billing', effectivePropertyId || 'ALL', params?.buildingId || 'ALL', params?.billingPeriod || '', params?.page || 1],
    queryFn: () => getBillingReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}

export function useCollectionReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'collections', effectivePropertyId || 'ALL', params?.buildingId || 'ALL', params?.fromDate || '', params?.toDate || '', params?.page || 1],
    queryFn: () => getCollectionReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}

export function useOutstandingReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'outstanding', effectivePropertyId || 'ALL', params?.buildingId || 'ALL', params?.page || 1],
    queryFn: () => getOutstandingReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}

export function useMessReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'mess', effectivePropertyId || 'ALL', params?.buildingId || 'ALL', params?.page || 1],
    queryFn: () => getMessReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}

export function useInventoryReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'inventory', effectivePropertyId || 'ALL', params?.page || 1],
    queryFn: () => getInventoryReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}

export function useProcurementReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'procurement', effectivePropertyId || 'ALL', params?.page || 1],
    queryFn: () => getProcurementReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}

export function useExpenseReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'expenses', effectivePropertyId || 'ALL', params?.page || 1],
    queryFn: () => getExpenseReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}

export function usePropertyPerformanceReportDetailed(params?: ReportQueryParams) {
  const { selectedProperty } = usePropertyContext();
  const effectivePropertyId = params?.propertyId || selectedProperty?.id;

  return useQuery({
    queryKey: ['reports', 'property-performance', effectivePropertyId || 'ALL', params?.buildingId || 'ALL'],
    queryFn: () => getPropertyPerformanceReportDetailedApi({ ...params, propertyId: effectivePropertyId }),
    staleTime: 30 * 1000,
  });
}
