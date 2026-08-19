import { apiClient } from '../../../api/client';
import type {
  ActivityItemDto,
  BillingReportDto,
  BillingReportResponseDto,
  CollectionReportResponseDto,
  DashboardOverviewDto,
  DateRangePresetDto,
  ExpenseReportDto,
  ExpenseReportResponseDto,
  InventoryReportResponseDto,
  MessReportDto,
  MessReportResponseDto,
  OccupancyReportDto,
  OccupancyReportResponseDto,
  OperationalAlertDto,
  OutstandingReportResponseDto,
  ProcurementReportResponseDto,
  PropertyPerformanceReportDto,
  ReportFilterDto,
  ResidentReportDto,
  ResidentReportResponseDto,
} from '@m-square/contracts';

export interface ReportQueryParams extends ReportFilterDto {
  period?: string; // YYYY-MM
  preset?: DateRangePresetDto;
  startDate?: string;
  endDate?: string;
}

export async function getDashboardOverviewApi(
  params?: ReportQueryParams
): Promise<DashboardOverviewDto> {
  const res = await apiClient.get<{ data: DashboardOverviewDto }>('/dashboard/owner/summary', { params });
  return res.data.data;
}

export async function getOperationalAlertsApi(
  params?: ReportQueryParams
): Promise<OperationalAlertDto[]> {
  const res = await apiClient.get<{ data: OperationalAlertDto[] }>('/dashboard/owner/alerts', { params });
  return res.data.data;
}

export async function getOccupancyReportApi(
  params?: ReportQueryParams
): Promise<OccupancyReportResponseDto> {
  const res = await apiClient.get<{ data: OccupancyReportResponseDto }>('/reports/occupancy', { params });
  return res.data.data;
}

export async function getResidentReportApi(params?: ReportQueryParams): Promise<ResidentReportResponseDto> {
  const res = await apiClient.get<{ data: ResidentReportResponseDto }>('/reports/residents', { params });
  return res.data.data;
}

export async function getBillingReportApi(params?: ReportQueryParams): Promise<BillingReportResponseDto> {
  const res = await apiClient.get<{ data: BillingReportResponseDto }>('/reports/billing', { params });
  return res.data.data;
}

export async function getMessReportApi(params?: ReportQueryParams): Promise<MessReportResponseDto> {
  const res = await apiClient.get<{ data: MessReportResponseDto }>('/reports/mess', { params });
  return res.data.data;
}

export async function getExpenseReportApi(params?: ReportQueryParams): Promise<ExpenseReportResponseDto> {
  const res = await apiClient.get<{ data: ExpenseReportResponseDto }>('/reports/expenses', { params });
  return res.data.data;
}

export async function getActivityReportApi(
  params?: ReportQueryParams & { limit?: number }
): Promise<ActivityItemDto[]> {
  const res = await apiClient.get<{ data: ActivityItemDto[] }>('/reports/activity', { params });
  return res.data.data;
}

// --- STEP 19 DETAILED REPORT APIS ---

export async function getResidentReportDetailedApi(
  params?: ReportQueryParams
): Promise<ResidentReportResponseDto> {
  const res = await apiClient.get<{ data: ResidentReportResponseDto }>('/reports/residents', { params });
  return res.data.data;
}

export async function getOccupancyReportDetailedApi(
  params?: ReportQueryParams
): Promise<OccupancyReportResponseDto> {
  const res = await apiClient.get<{ data: OccupancyReportResponseDto }>('/reports/occupancy', { params });
  return res.data.data;
}

export async function getBillingReportDetailedApi(
  params?: ReportQueryParams
): Promise<BillingReportResponseDto> {
  const res = await apiClient.get<{ data: BillingReportResponseDto }>('/reports/billing', { params });
  return res.data.data;
}

export async function getCollectionReportDetailedApi(
  params?: ReportQueryParams
): Promise<CollectionReportResponseDto> {
  const res = await apiClient.get<{ data: CollectionReportResponseDto }>('/reports/collections', { params });
  return res.data.data;
}

export async function getOutstandingReportDetailedApi(
  params?: ReportQueryParams
): Promise<OutstandingReportResponseDto> {
  const res = await apiClient.get<{ data: OutstandingReportResponseDto }>('/reports/outstanding', { params });
  return res.data.data;
}

export async function getMessReportDetailedApi(
  params?: ReportQueryParams
): Promise<MessReportResponseDto> {
  const res = await apiClient.get<{ data: MessReportResponseDto }>('/reports/mess', { params });
  return res.data.data;
}

export async function getInventoryReportDetailedApi(
  params?: ReportQueryParams
): Promise<InventoryReportResponseDto> {
  const res = await apiClient.get<{ data: InventoryReportResponseDto }>('/reports/inventory', { params });
  return res.data.data;
}

export async function getProcurementReportDetailedApi(
  params?: ReportQueryParams
): Promise<ProcurementReportResponseDto> {
  const res = await apiClient.get<{ data: ProcurementReportResponseDto }>('/reports/procurement', { params });
  return res.data.data;
}

export async function getExpenseReportDetailedApi(
  params?: ReportQueryParams
): Promise<ExpenseReportResponseDto> {
  const res = await apiClient.get<{ data: ExpenseReportResponseDto }>('/reports/expenses', { params });
  return res.data.data;
}

export async function getPropertyPerformanceReportDetailedApi(
  params?: ReportQueryParams
): Promise<PropertyPerformanceReportDto> {
  const res = await apiClient.get<{ data: PropertyPerformanceReportDto }>('/reports/property-performance', { params });
  return res.data.data;
}
