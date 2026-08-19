import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adjustInventoryApi,
  cancelResidentMessSubscriptionApi,
  changeResidentMessSubscriptionApi,
  createExpenseApi,
  createInventoryItemApi,
  createMealPlanApi,
  createMealTypeApi,
  createMessApi,
  createProcurementApi,
  createResidentMessSubscriptionApi,
  createVendorApi,
  getActiveSubscriptionByStayApi,
  getExpensesApi,
  getInventoryItemsApi,
  getInventoryStockLedgerApi,
  getMealPlansApi,
  getMealTypesApi,
  getMessConfigApi,
  getMessesApi,
  getProcurementsApi,
  getResidentMessSubscriptionApi,
  getTodayMetricsApi,
  getVendorsApi,
  recordConsumptionApi,
  updateInventoryItemApi,
  updateMessConfigApi,
  updateVendorApi,
} from '../api/mess.api';
import type {
  CreateExpenseDto,
  CreateInventoryItemDto,
  CreateMealPlanDto,
  CreateMealTypeDto,
  CreateMessDto,
  CreateProcurementDto,
  CreateVendorDto,
  RecordConsumptionDto,
  UpdateMessConfigDto,
} from '@m-square/contracts';

export function useMessConfig() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mess', 'config'],
    queryFn: getMessConfigApi,
  });

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateMessConfigDto) => updateMessConfigApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'config'] });
    },
  });

  return {
    ...query,
    updateConfig: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

export function useMealTypes(messId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mess', 'meal-types', messId],
    queryFn: () => (messId ? getMealTypesApi(messId) : []),
    enabled: !!messId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateMealTypeDto) => createMealTypeApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'meal-types'] });
    },
  });

  return {
    ...query,
    createMealType: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useMesses() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mess', 'facilities'],
    queryFn: getMessesApi,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateMessDto) => createMessApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'facilities'] });
    },
  });

  return { ...query, createMess: createMutation.mutateAsync, isCreating: createMutation.isPending };
}

export function useMealPlans(messId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mess', 'meal-plans', messId],
    queryFn: () => (messId ? getMealPlansApi(messId) : []),
    enabled: !!messId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateMealPlanDto) => createMealPlanApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'meal-plans'] });
    },
  });

  return {
    ...query,
    createMealPlan: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useTodayMetrics(messId?: string, date?: string) {
  return useQuery({
    queryKey: ['mess', 'today-metrics', messId, date],
    queryFn: () => (messId ? getTodayMetricsApi(messId, date) : null),
    enabled: !!messId,
  });
}

export function useResidentMessSubscription(residentId?: string) {
  return useQuery({
    queryKey: ['mess-subscription', residentId],
    queryFn: () => (residentId ? getResidentMessSubscriptionApi(residentId) : null),
    enabled: !!residentId,
  });
}

export function useStayMessSubscription(stayId?: string) {
  return useQuery({
    queryKey: ['mess', 'subscription', stayId],
    queryFn: () => (stayId ? getActiveSubscriptionByStayApi(stayId) : null),
    enabled: !!stayId,
  });
}

export function useCreateMessSubscription(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: { messId: string; mealPlanId: string; startDate?: string; notes?: string }) =>
      createResidentMessSubscriptionApi(residentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resident', residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['mess-subscription', residentId] });
      queryClient.invalidateQueries({ queryKey: ['mess'] });
      queryClient.invalidateQueries({ queryKey: ['mess-plans'] });
      queryClient.invalidateQueries({ queryKey: ['meal-consumptions', residentId] });
      queryClient.invalidateQueries({ queryKey: ['billing', residentId] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'overview'] });
    },
  });
}

export function useChangeMessSubscription(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: { messId: string; mealPlanId: string; startDate?: string }) =>
      changeResidentMessSubscriptionApi(residentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resident', residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['mess-subscription', residentId] });
      queryClient.invalidateQueries({ queryKey: ['mess'] });
      queryClient.invalidateQueries({ queryKey: ['mess-plans'] });
      queryClient.invalidateQueries({ queryKey: ['meal-consumptions', residentId] });
      queryClient.invalidateQueries({ queryKey: ['billing', residentId] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'overview'] });
    },
  });
}

export function useCancelMessSubscription(residentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto?: { cancellationDate?: string; reason?: string }) =>
      cancelResidentMessSubscriptionApi(residentId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resident', residentId] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      queryClient.invalidateQueries({ queryKey: ['mess-subscription', residentId] });
      queryClient.invalidateQueries({ queryKey: ['mess'] });
      queryClient.invalidateQueries({ queryKey: ['mess-plans'] });
      queryClient.invalidateQueries({ queryKey: ['meal-consumptions', residentId] });
      queryClient.invalidateQueries({ queryKey: ['billing', residentId] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'overview'] });
    },
  });
}

export function useMealConsumption() {
  const queryClient = useQueryClient();

  const recordMutation = useMutation({
    mutationFn: (dto: RecordConsumptionDto) => recordConsumptionApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'today-metrics'] });
    },
  });

  return { recordConsumption: recordMutation.mutateAsync, isRecording: recordMutation.isPending };
}

export function useStockLedger(itemId?: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['stock-ledger', itemId, page, pageSize],
    queryFn: () => (itemId ? getInventoryStockLedgerApi(itemId, page, pageSize) : { items: [], total: 0 }),
    enabled: !!itemId,
  });
}

export function useMessInventory(
  messId?: string,
  page = 1,
  pageSize = 20,
  search?: string,
  category?: string,
  status?: string
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mess', 'inventory', messId, page, pageSize, search, category, status],
    queryFn: () =>
      messId
        ? getInventoryItemsApi(messId, page, pageSize, search, category, status)
        : { items: [], total: 0 },
    enabled: !!messId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateInventoryItemDto) => createInventoryItemApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'inventory'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateInventoryItemDto> & { status?: string } }) =>
      updateInventoryItemApi(id, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', variables.id] });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: (dto: {
      messId: string;
      inventoryItemId: string;
      transactionType: string;
      quantity: number;
      notes?: string;
    }) => adjustInventoryApi(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-item', variables.inventoryItemId] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger', variables.inventoryItemId] });
    },
  });

  return {
    ...query,
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    adjustItem: adjustMutation.mutateAsync,
  };
}

export function useVendors(page = 1, pageSize = 20, search?: string, status?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mess', 'vendors', page, pageSize, search, status],
    queryFn: () => getVendorsApi(page, pageSize, search, status),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateVendorDto) => createVendorApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'vendors'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateVendorDto> & { status?: string } }) =>
      updateVendorApi(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'vendors'] });
    },
  });

  return {
    ...query,
    createVendor: createMutation.mutateAsync,
    updateVendor: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useProcurement(
  messId?: string,
  page = 1,
  pageSize = 20,
  search?: string,
  vendorId?: string
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mess', 'procurements', messId, page, pageSize, search, vendorId],
    queryFn: () =>
      messId ? getProcurementsApi(messId, page, pageSize, search, vendorId) : { items: [], total: 0 },
    enabled: !!messId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateProcurementDto) => createProcurementApi(dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'procurements'] });
      queryClient.invalidateQueries({ queryKey: ['mess', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['mess', 'expenses'] });
      for (const item of variables.items) {
        queryClient.invalidateQueries({ queryKey: ['stock-ledger', item.inventoryItemId] });
      }
    },
  });

  return {
    ...query,
    createProcurement: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useMessExpenses(
  messId?: string,
  page = 1,
  pageSize = 20,
  search?: string,
  category?: string,
  vendorId?: string
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mess', 'expenses', messId, page, pageSize, search, category, vendorId],
    queryFn: () =>
      messId
        ? getExpensesApi(messId, page, pageSize, search, category, vendorId)
        : { items: [], total: 0 },
    enabled: !!messId,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateExpenseDto) => createExpenseApi(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mess', 'expenses'] });
    },
  });

  return {
    ...query,
    createExpense: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
