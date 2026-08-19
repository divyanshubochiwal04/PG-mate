export interface OccupancyQueryResult {
    totalProperties: number;
    totalBuildings: number;
    totalFloors: number;
    totalRooms: number;
    totalBeds: number;
    availableBeds: number;
    occupiedBeds: number;
    maintenanceBeds: number;
    inactiveBeds: number;
    occupancyPercentage: number;
}
export interface ResidentQueryResult {
    totalActiveResidents: number;
    totalInactiveResidents: number;
    currentCheckedInResidents: number;
    checkedOutResidents: number;
    residentsWithoutStay: number;
    newAdmissionsInPeriod: number;
    checkoutsInPeriod: number;
    transfersInPeriod: number;
}
export interface BillingQueryResult {
    totalInvoicedPaise: number;
    totalCollectedPaise: number;
    totalOutstandingPaise: number;
    overdueAmountPaise: number;
    partiallyPaidAmountPaise: number;
    paidInvoiceCount: number;
    unpaidInvoiceCount: number;
    overdueInvoiceCount: number;
    collectionPercentage: number;
}
export interface MessQueryResult {
    activeMessSubscribers: number;
    expectedMealsToday: number;
    mealsConsumedToday: number;
    mealsSkippedToday: number;
    consumptionPercentage: number;
    currentInventoryValuePaise: number;
    totalInventoryItems: number;
    lowStockItemCount: number;
    outOfStockItemCount: number;
    currentMonthProcurementPaise: number;
    currentMonthMessExpensePaise: number;
}
export interface ExpenseCategoryQueryResult {
    category: string;
    amountPaise: number;
}
export interface ExpenseQueryResult {
    currentMonthExpensesPaise: number;
    previousMonthExpensesPaise: number;
    messExpensesPaise: number;
    maintenanceExpensesPaise: number;
    utilitiesExpensesPaise: number;
    otherExpensesPaise: number;
    categories: ExpenseCategoryQueryResult[];
}
export interface ActivityQueryResultItem {
    id: string;
    type: 'RESIDENT_REGISTERED' | 'RESIDENT_CHECKED_IN' | 'RESIDENT_TRANSFERRED' | 'RESIDENT_CHECKED_OUT' | 'PAYMENT_COLLECTED' | 'INVOICE_GENERATED' | 'MESS_PROCUREMENT' | 'MESS_EXPENSE' | 'INVENTORY_ADJUSTMENT';
    title: string;
    description: string;
    timestamp: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
}
export interface OperationalAlertQueryResultItem {
    id: string;
    type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OUTSTANDING_DUES' | 'NO_STAY' | 'HIGH_OCCUPANCY';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    description: string;
    count: number;
    targetScreen: string;
}
//# sourceMappingURL=reporting-query-types.d.ts.map