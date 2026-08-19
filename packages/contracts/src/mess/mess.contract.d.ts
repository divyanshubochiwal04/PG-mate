export type MessScopeType = 'CENTRAL' | 'PER_BLOCK';
export type MessBillingMode = 'PER_MEAL' | 'MONTHLY' | 'HYBRID';
export type MessSubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED' | 'SUPERSEDED';
export type MessConsumptionStatus = 'CONSUMED' | 'SKIPPED' | 'CANCELLED';
export type MessInventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type MessTransactionType = 'OPENING_STOCK' | 'PURCHASE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'CONSUMPTION' | 'WASTAGE';
export type MessVendorStatus = 'ACTIVE' | 'INACTIVE';
export type MessExpenseCategory = 'GAS' | 'ELECTRICITY' | 'SALARY' | 'CLEANING' | 'TRANSPORT' | 'MAINTENANCE' | 'MISCELLANEOUS';
export interface MessConfigDto {
    id: string;
    organizationId: string;
    isEnabled: boolean;
    scopeType: MessScopeType;
    billingMode: MessBillingMode;
    createdAt: string;
    updatedAt: string;
}
export interface UpdateMessConfigDto {
    isEnabled?: boolean;
    scopeType?: MessScopeType;
    billingMode?: MessBillingMode;
}
export interface MessDto {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    scopeType: MessScopeType;
    isActive: boolean;
    assignedBuildingIds?: string[];
    createdAt: string;
    updatedAt: string;
}
export interface CreateMessDto {
    name: string;
    code: string;
    scopeType?: MessScopeType;
}
export interface AssignMessBuildingsDto {
    buildingIds: string[];
}
export interface MealTypeDto {
    id: string;
    organizationId: string;
    messId: string;
    name: string;
    startTime: string;
    endTime: string;
    displayOrder: number;
    isActive: boolean;
}
export interface CreateMealTypeDto {
    messId: string;
    name: string;
    startTime: string;
    endTime: string;
    displayOrder?: number;
}
export interface MealPlanDto {
    id: string;
    organizationId: string;
    messId: string;
    name: string;
    description: string | null;
    billingMode: 'PER_MEAL' | 'MONTHLY';
    price: number;
    includedMealTypes: string;
    version: number;
    isActive: boolean;
}
export interface CreateMealPlanDto {
    messId: string;
    name: string;
    description?: string;
    billingMode: 'PER_MEAL' | 'MONTHLY';
    price: number;
    includedMealTypes?: string;
}
export interface MenuItemDto {
    id: string;
    itemName: string;
    category: string;
    displayOrder: number;
}
export interface MenuDto {
    id: string;
    organizationId: string;
    messId: string;
    menuDate: string;
    mealTypeId: string;
    notes: string | null;
    items: MenuItemDto[];
}
export interface UpsertMenuDto {
    messId: string;
    menuDate: string;
    mealTypeId: string;
    notes?: string;
    items: {
        itemName: string;
        category?: string;
        displayOrder?: number;
    }[];
}
export interface MessSubscriptionDto {
    id: string;
    organizationId: string;
    residentId: string;
    stayId: string;
    messId: string;
    mealPlanId: string;
    billingMode: 'PER_MEAL' | 'MONTHLY';
    priceAtSubscription: number;
    status: MessSubscriptionStatus;
    startDate: string;
    endDate: string | null;
    messName?: string;
    mealPlanName?: string;
}
export interface CreateMessSubscriptionDto {
    residentId: string;
    stayId: string;
    messId: string;
    mealPlanId: string;
    billingMode: 'PER_MEAL' | 'MONTHLY';
    priceAtSubscription: number;
    startDate?: string;
}
export interface CreateResidentMessSubscriptionRequestDto {
    messId: string;
    mealPlanId: string;
    startDate?: string;
    notes?: string;
}
export interface UpdateResidentMessSubscriptionRequestDto {
    messId: string;
    mealPlanId: string;
    startDate?: string;
}
export interface CancelResidentMessSubscriptionRequestDto {
    cancellationDate?: string;
    reason?: string;
}
export interface MealConsumptionDto {
    id: string;
    organizationId: string;
    subscriptionId: string;
    residentId: string;
    stayId: string;
    messId: string;
    mealTypeId: string;
    consumptionDate: string;
    status: MessConsumptionStatus;
    notes: string | null;
    createdAt: string;
}
export interface RecordConsumptionDto {
    subscriptionId: string;
    residentId: string;
    stayId: string;
    messId: string;
    mealTypeId: string;
    consumptionDate?: string;
    status?: MessConsumptionStatus;
    notes?: string;
}
export interface MessTodayMetricsDto {
    expected: number;
    consumed: number;
    skipped: number;
    date: string;
}
export interface MessInventoryItemDto {
    id: string;
    organizationId: string;
    messId: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    minimumStock: number;
    reorderLevel: number;
    status: MessInventoryStatus;
    createdAt: string;
    updatedAt: string;
}
export interface CreateInventoryItemDto {
    messId: string;
    name: string;
    category: string;
    unit: string;
    currentStock?: number;
    minimumStock?: number;
    reorderLevel?: number;
}
export interface AdjustInventoryDto {
    messId: string;
    inventoryItemId: string;
    transactionType: MessTransactionType;
    quantity: number;
    notes?: string;
}
export interface MessInventoryTransactionDto {
    id: string;
    organizationId: string;
    messId: string;
    inventoryItemId: string;
    transactionType: MessTransactionType;
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    unit: string;
    notes: string | null;
    createdAt: string;
}
export interface MessVendorDto {
    id: string;
    organizationId: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    status: MessVendorStatus;
    notes: string | null;
    createdAt: string;
}
export interface CreateVendorDto {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}
export interface MessProcurementItemDto {
    id: string;
    procurementId: string;
    inventoryItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
export interface MessProcurementDto {
    id: string;
    organizationId: string;
    messId: string;
    vendorId: string;
    purchaseDate: string;
    invoiceReference: string | null;
    totalAmount: number;
    notes: string | null;
    items?: MessProcurementItemDto[];
    createdAt: string;
}
export interface CreateProcurementItemInputDto {
    inventoryItemId: string;
    quantity: number;
    unitPrice: number;
}
export interface CreateProcurementDto {
    messId: string;
    vendorId: string;
    purchaseDate?: string;
    invoiceReference?: string;
    notes?: string;
    items: CreateProcurementItemInputDto[];
}
export interface UpdateInventoryItemDto {
    name?: string;
    category?: string;
    unit?: string;
    minimumStock?: number;
    reorderLevel?: number;
    status?: MessInventoryStatus;
}
export interface MessInventoryQueryDto {
    messId: string;
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    status?: MessInventoryStatus;
}
export interface MessVendorQueryDto {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: MessVendorStatus;
}
export interface UpdateVendorDto {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    status?: MessVendorStatus;
    notes?: string;
}
export interface MessProcurementQueryDto {
    messId: string;
    page?: number;
    pageSize?: number;
    search?: string;
    vendorId?: string;
}
export interface MessExpenseDto {
    id: string;
    organizationId: string;
    messId: string;
    category: MessExpenseCategory;
    amount: number;
    expenseDate: string;
    vendorId: string | null;
    referenceNo: string | null;
    notes: string | null;
    createdAt: string;
}
export interface MessExpenseQueryDto {
    messId: string;
    page?: number;
    pageSize?: number;
    search?: string;
    category?: MessExpenseCategory;
    vendorId?: string;
}
export interface CreateExpenseDto {
    messId: string;
    category: MessExpenseCategory;
    amount: number;
    expenseDate?: string;
    vendorId?: string;
    referenceNo?: string;
    notes?: string;
}
//# sourceMappingURL=mess.contract.d.ts.map