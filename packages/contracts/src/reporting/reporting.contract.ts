export type DateRangePresetDto = 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM';

export interface DateRangeDto {
  preset: DateRangePresetDto;
  startDate: string;
  endDate: string;
}

export interface ReportFilterDto {
  propertyId?: string;
  buildingId?: string;
  fromDate?: string;
  toDate?: string;
  billingPeriod?: string; // YYYY-MM
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface OwnerDashboardQueryDto {
  propertyId?: string;
  buildingId?: string;
  period?: string; // Strict YYYY-MM format
  preset?: DateRangePresetDto;
  startDate?: string;
  endDate?: string;
}

// 1. RESIDENT REPORT CONTRACTS
export interface ResidentReportRowDto {
  residentId: string;
  residentCode: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  stayStatus?: string | null;
  propertyName?: string | null;
  buildingName?: string | null;
  floorNumber?: number | null;
  roomNumber?: string | null;
  bedNumber?: string | null;
  admissionDate?: string | null;
  checkoutDate?: string | null;
  messStatus?: string | null;
  outstandingAmount: number;
}

export interface ResidentReportResponseDto {
  summary: {
    totalResidents: number;
    activeResidents: number;
    checkedOutResidents: number;
    residentsWithoutStay: number;
    occupiedBeds: number;
    outstandingAmount: number;
  };
  rows: ResidentReportRowDto[];
  page: number;
  pageSize: number;
  total: number;
}

// 2. OCCUPANCY REPORT CONTRACTS
export interface OccupancyReportRowDto {
  propertyId: string;
  propertyName: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorNumber: number;
  roomId: string;
  roomNumber: string;
  capacity: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercentage: number;
}

export interface OccupancyReportResponseDto {
  summary: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyPercentage: number;
    totalRooms: number;
    totalFloors: number;
  };
  rows: OccupancyReportRowDto[];
}

// 3. BILLING REPORT CONTRACTS
export interface BillingReportRowDto {
  invoiceId: string;
  invoiceNumber: string;
  residentId: string;
  residentName: string;
  residentCode: string;
  propertyName?: string | null;
  buildingName?: string | null;
  billingPeriod?: string | null;
  invoiceStatus: string;
  invoiceTotal: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
}

export interface BillingReportResponseDto {
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    overdueAmount: number;
    paidInvoices: number;
    partialInvoices: number;
    unpaidInvoices: number;
    cancelledInvoices: number;
  };
  rows: BillingReportRowDto[];
  page: number;
  pageSize: number;
  total: number;
}

// 4. COLLECTION / PAYMENT REPORT CONTRACTS
export interface CollectionReportRowDto {
  paymentId: string;
  receiptId?: string | null;
  receiptNumber?: string | null;
  residentId: string;
  residentName: string;
  residentCode: string;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  amount: number;
  paymentMethod: string;
  reference?: string | null;
  paymentDate: string;
  status: string;
}

export interface CollectionReportResponseDto {
  summary: {
    totalCollected: number;
    paymentCount: number;
    cashCollected: number;
    upiCollected: number;
    bankTransferCollected: number;
    otherCollected: number;
  };
  rows: CollectionReportRowDto[];
  page: number;
  pageSize: number;
  total: number;
}

// 5. OUTSTANDING DUES REPORT CONTRACTS
export interface OutstandingReportRowDto {
  residentId: string;
  residentCode: string;
  residentName: string;
  phone?: string | null;
  propertyName?: string | null;
  buildingName?: string | null;
  roomNumber?: string | null;
  bedNumber?: string | null;
  invoiceCount: number;
  totalInvoiced: number;
  totalPaid: number;
  balanceDue: number;
  oldestDueDate?: string | null;
  daysOutstanding: number;
}

export interface OutstandingReportResponseDto {
  summary: {
    totalOutstandingAmount: number;
    totalResidentsWithDues: number;
    totalOverdueInvoices: number;
  };
  rows: OutstandingReportRowDto[];
  page: number;
  pageSize: number;
  total: number;
}

// 6. MESS REPORT CONTRACTS
export interface MessReportRowDto {
  residentId: string;
  residentName: string;
  residentCode: string;
  messName: string;
  mealPlanName: string;
  subscriptionStatus: string;
  monthlyPrice: number;
  startDate: string;
  endDate?: string | null;
  consumptionCount: number;
}

export interface MessReportResponseDto {
  summary: {
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    monthlySubscriptionValue: number;
    totalMealConsumptions: number;
  };
  rows: MessReportRowDto[];
  page: number;
  pageSize: number;
  total: number;
}

// 7. INVENTORY REPORT CONTRACTS
export interface InventoryReportRowDto {
  inventoryItemId: string;
  itemName: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  status: string;
  totalProcuredQuantity: number;
  totalConsumedQuantity: number;
  totalProcurementValue: number;
}

export interface InventoryReportResponseDto {
  summary: {
    totalItems: number;
    inStockItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalProcurementValue: number;
  };
  rows: InventoryReportRowDto[];
  page: number;
  pageSize: number;
  total: number;
}

// 8. PROCUREMENT REPORT CONTRACTS
export interface ProcurementReportRowDto {
  procurementId: string;
  invoiceReference: string;
  vendorId?: string | null;
  vendorName: string;
  procurementDate: string;
  totalAmount: number;
  itemCount: number;
}

export interface ProcurementReportResponseDto {
  summary: {
    procurementCount: number;
    totalProcurementAmount: number;
  };
  rows: ProcurementReportRowDto[];
  page: number;
  pageSize: number;
  total: number;
}

// 9. EXPENSE REPORT CONTRACTS
export interface ExpenseReportCategoryDto {
  category: string;
  count: number;
  totalAmount: number;
}

export interface ExpenseReportRowDto {
  expenseId: string;
  category: string;
  description?: string | null;
  vendorName?: string | null;
  expenseDate: string;
  amount: number;
}

export interface ExpenseReportResponseDto {
  summary: {
    expenseCount: number;
    totalExpenses: number;
  };
  categories: ExpenseReportCategoryDto[];
  rows: ExpenseReportRowDto[];
  page: number;
  pageSize: number;
  total: number;
}

// 10. PROPERTY PERFORMANCE REPORT CONTRACTS
export interface PropertyPerformanceItemDto {
  propertyId: string;
  propertyName: string;
  buildingId?: string | null;
  buildingName?: string | null;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  occupancyPercentage: number;
  activeResidents: number;
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalExpenses: number;
  netCashFlow: number;
  activeMessSubscriptions: number;
  lowStockItems: number;
}

export interface PropertyPerformanceReportDto {
  summary: {
    totalProperties: number;
    totalBeds: number;
    occupiedBeds: number;
    overallOccupancyPercentage: number;
    totalCollected: number;
    totalExpenses: number;
    totalNetCashFlow: number;
  };
  items: PropertyPerformanceItemDto[];
}

export interface OccupancyReportDto {
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

export interface ResidentReportDto {
  totalActiveResidents: number;
  totalInactiveResidents: number;
  currentCheckedInResidents: number;
  checkedOutResidents: number;
  residentsWithoutStay: number;
  newAdmissionsInPeriod: number;
  checkoutsInPeriod: number;
  transfersInPeriod: number;
}

export interface BillingReportDto {
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueAmount: number;
  partiallyPaidAmount: number;
  paidInvoiceCount: number;
  unpaidInvoiceCount: number;
  overdueInvoiceCount: number;
  collectionPercentage: number;
  netCashFlow: number;
}

export interface MessReportDto {
  activeMessSubscribers: number;
  expectedMealsToday: number;
  mealsConsumedToday: number;
  mealsSkippedToday: number;
  consumptionPercentage: number;
  currentInventoryValue: number;
  totalInventoryItems: number;
  lowStockItemCount: number;
  outOfStockItemCount: number;
  currentMonthProcurementAmount: number;
  currentMonthMessExpenseAmount: number;
}

export interface ExpenseReportDto {
  currentMonthExpenses: number;
  previousMonthExpenses: number;
  messExpenses: number;
  maintenanceExpenses: number;
  utilitiesExpenses: number;
  otherExpenses: number;
  categories: ExpenseReportCategoryDto[];
}

export interface ActivityItemDto {
  id: string;
  type:
    | 'RESIDENT_REGISTERED'
    | 'RESIDENT_CHECKED_IN'
    | 'RESIDENT_TRANSFERRED'
    | 'RESIDENT_CHECKED_OUT'
    | 'PAYMENT_COLLECTED'
    | 'INVOICE_GENERATED'
    | 'MESS_PROCUREMENT'
    | 'MESS_EXPENSE'
    | 'INVENTORY_ADJUSTMENT';
  title: string;
  description: string;
  timestamp: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface OperationalAlertDto {
  id: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OUTSTANDING_DUES' | 'NO_STAY' | 'HIGH_OCCUPANCY';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  count: number;
  targetScreen: string;
}

export interface DashboardOverviewDto {
  dateRange: DateRangeDto;
  occupancy: OccupancyReportDto;
  residents: ResidentReportDto;
  billing: BillingReportDto;
  mess: MessReportDto;
  expenses: ExpenseReportDto;
  alerts: OperationalAlertDto[];
  recentActivity: ActivityItemDto[];
}

export type OwnerDashboardSummaryDto = DashboardOverviewDto;
