import { apiClient } from '../../../api/client';
import type {
  AssignMessBuildingsDto,
  CreateExpenseDto,
  CreateInventoryItemDto,
  CreateMealPlanDto,
  CreateMealTypeDto,
  CreateMessDto,
  CreateProcurementDto,
  CreateVendorDto,
  MealConsumptionDto,
  MealPlanDto,
  MealTypeDto,
  MenuDto,
  MessConfigDto,
  MessDto,
  MessExpenseDto,
  MessInventoryItemDto,
  MessProcurementDto,
  MessSubscriptionDto,
  MessTodayMetricsDto,
  MessVendorDto,
  RecordConsumptionDto,
  UpdateMessConfigDto,
  UpsertMenuDto,
} from '@m-square/contracts';

export async function getMessConfigApi(): Promise<MessConfigDto> {
  const res = await apiClient.get<{ data: MessConfigDto }>('/mess/config');
  return res.data.data;
}

export async function updateMessConfigApi(dto: UpdateMessConfigDto): Promise<MessConfigDto> {
  const res = await apiClient.put<{ data: MessConfigDto }>('/mess/config', dto);
  return res.data.data;
}

export async function getMessesApi(): Promise<MessDto[]> {
  const res = await apiClient.get<{ data: MessDto[] }>('/mess/facilities');
  return res.data.data;
}

export async function createMessApi(dto: CreateMessDto): Promise<MessDto> {
  const res = await apiClient.post<{ data: MessDto }>('/mess/facilities', dto);
  return res.data.data;
}

export async function assignMessBuildingsApi(
  id: string,
  dto: AssignMessBuildingsDto
): Promise<void> {
  await apiClient.post(`/mess/facilities/${id}/buildings`, dto);
}

export async function getMealTypesApi(messId: string): Promise<MealTypeDto[]> {
  const res = await apiClient.get<{ data: MealTypeDto[] }>('/mess/meal-types', {
    params: { messId },
  });
  return res.data.data;
}

export async function createMealTypeApi(dto: CreateMealTypeDto): Promise<MealTypeDto> {
  const res = await apiClient.post<{ data: MealTypeDto }>('/mess/meal-types', dto);
  return res.data.data;
}

export async function getMealPlansApi(messId: string): Promise<MealPlanDto[]> {
  const res = await apiClient.get<{ data: MealPlanDto[] }>('/mess/meal-plans', {
    params: { messId },
  });
  return res.data.data;
}

export async function createMealPlanApi(dto: CreateMealPlanDto): Promise<MealPlanDto> {
  const res = await apiClient.post<{ data: MealPlanDto }>('/mess/meal-plans', dto);
  return res.data.data;
}

export async function getMenuApi(
  messId: string,
  date: string,
  mealTypeId: string
): Promise<MenuDto | null> {
  const res = await apiClient.get<{ data: MenuDto | null }>('/mess/menu', {
    params: { messId, date, mealTypeId },
  });
  return res.data.data;
}

export async function upsertMenuApi(dto: UpsertMenuDto): Promise<void> {
  await apiClient.post('/mess/menu', dto);
}

export async function getActiveSubscriptionByStayApi(
  stayId: string
): Promise<MessSubscriptionDto | null> {
  const res = await apiClient.get<{ data: MessSubscriptionDto | null }>(
    `/mess/subscriptions/stay/${stayId}`
  );
  return res.data.data;
}

export async function recordConsumptionApi(dto: RecordConsumptionDto): Promise<MealConsumptionDto> {
  const res = await apiClient.post<{ data: MealConsumptionDto }>('/mess/consumption', dto);
  return res.data.data;
}

export async function getTodayMetricsApi(
  messId: string,
  date?: string
): Promise<MessTodayMetricsDto> {
  const res = await apiClient.get<{ data: MessTodayMetricsDto }>('/mess/consumption/today', {
    params: { messId, date },
  });
  return res.data.data;
}

export async function getInventoryItemsApi(
  messId: string,
  page = 1,
  pageSize = 20,
  search?: string,
  category?: string,
  status?: string
): Promise<{ items: MessInventoryItemDto[]; total: number }> {
  const res = await apiClient.get<{ data: { items: MessInventoryItemDto[]; total: number } }>(
    '/mess/inventory',
    { params: { messId, page, pageSize, search, category, status } }
  );
  return res.data.data;
}

export async function createInventoryItemApi(
  dto: CreateInventoryItemDto
): Promise<MessInventoryItemDto> {
  const res = await apiClient.post<{ data: MessInventoryItemDto }>('/mess/inventory', dto);
  return res.data.data;
}

export async function updateInventoryItemApi(
  id: string,
  dto: Partial<CreateInventoryItemDto> & { status?: string }
): Promise<MessInventoryItemDto> {
  const res = await apiClient.patch<{ data: MessInventoryItemDto }>(`/mess/inventory/${id}`, dto);
  return res.data.data;
}

export async function getInventoryStockLedgerApi(
  itemId: string,
  page = 1,
  pageSize = 20
): Promise<{ items: any[]; total: number }> {
  const res = await apiClient.get<{ data: { items: any[]; total: number } }>(
    `/mess/inventory/${itemId}/ledger`,
    { params: { page, pageSize } }
  );
  return res.data.data;
}

export async function adjustInventoryApi(dto: {
  messId: string;
  inventoryItemId: string;
  transactionType: string;
  quantity: number;
  notes?: string;
}): Promise<void> {
  await apiClient.post('/mess/inventory/adjust', dto);
}

export async function getVendorsApi(
  page = 1,
  pageSize = 20,
  search?: string,
  status?: string
): Promise<{ items: MessVendorDto[]; total: number }> {
  const res = await apiClient.get<{ data: { items: MessVendorDto[]; total: number } }>(
    '/mess/vendors',
    { params: { page, pageSize, search, status } }
  );
  return res.data.data;
}

export async function createVendorApi(dto: CreateVendorDto): Promise<MessVendorDto> {
  const res = await apiClient.post<{ data: MessVendorDto }>('/mess/vendors', dto);
  return res.data.data;
}

export async function updateVendorApi(
  id: string,
  dto: Partial<CreateVendorDto> & { status?: string }
): Promise<MessVendorDto> {
  const res = await apiClient.patch<{ data: MessVendorDto }>(`/mess/vendors/${id}`, dto);
  return res.data.data;
}

export async function getProcurementsApi(
  messId: string,
  page = 1,
  pageSize = 20,
  search?: string,
  vendorId?: string
): Promise<{ items: MessProcurementDto[]; total: number }> {
  const res = await apiClient.get<{ data: { items: MessProcurementDto[]; total: number } }>(
    '/mess/procurements',
    { params: { messId, page, pageSize, search, vendorId } }
  );
  return res.data.data;
}

export async function createProcurementApi(dto: CreateProcurementDto): Promise<MessProcurementDto> {
  const res = await apiClient.post<{ data: MessProcurementDto }>('/mess/procurements', dto);
  return res.data.data;
}

export async function getExpensesApi(
  messId: string,
  page = 1,
  pageSize = 20,
  search?: string,
  category?: string,
  vendorId?: string
): Promise<{ items: MessExpenseDto[]; total: number }> {
  const res = await apiClient.get<{ data: { items: MessExpenseDto[]; total: number } }>(
    '/mess/expenses',
    { params: { messId, page, pageSize, search, category, vendorId } }
  );
  return res.data.data;
}

export async function createExpenseApi(dto: CreateExpenseDto): Promise<MessExpenseDto> {
  const res = await apiClient.post<{ data: MessExpenseDto }>('/mess/expenses', dto);
  return res.data.data;
}

export async function getResidentMessSubscriptionApi(
  residentId: string
): Promise<MessSubscriptionDto | null> {
  const res = await apiClient.get<{ data: MessSubscriptionDto | null }>(
    `/residents/${residentId}/mess-subscription`
  );
  return res.data.data;
}

export async function createResidentMessSubscriptionApi(
  residentId: string,
  dto: { messId: string; mealPlanId: string; startDate?: string; notes?: string }
): Promise<MessSubscriptionDto> {
  const res = await apiClient.post<{ data: MessSubscriptionDto }>(
    `/residents/${residentId}/mess-subscription`,
    dto
  );
  return res.data.data;
}

export async function changeResidentMessSubscriptionApi(
  residentId: string,
  dto: { messId: string; mealPlanId: string; startDate?: string }
): Promise<MessSubscriptionDto> {
  const res = await apiClient.patch<{ data: MessSubscriptionDto }>(
    `/residents/${residentId}/mess-subscription`,
    dto
  );
  return res.data.data;
}

export async function cancelResidentMessSubscriptionApi(
  residentId: string,
  dto?: { cancellationDate?: string; reason?: string }
): Promise<MessSubscriptionDto> {
  const res = await apiClient.post<{ data: MessSubscriptionDto }>(
    `/residents/${residentId}/mess-subscription/cancel`,
    dto || {}
  );
  return res.data.data;
}
