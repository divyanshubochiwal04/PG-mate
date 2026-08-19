import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyBillingReportingRepository,
  KyselyFinancialReportingRepository,
  KyselyInventoryReportingRepository,
  KyselyMessReportingRepository,
  KyselyOccupancyReportingRepository,
  KyselyReportingRepository,
  KyselyResidentReportingRepository,
} from '@m-square/database';
import type {
  ActivityItemDto,
  BillingReportDto,
  BillingReportResponseDto,
  CollectionReportResponseDto,
  DashboardOverviewDto,
  DateRangeDto,
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PERIOD_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function sanitizeId(id?: string): string | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const trimmed = id.trim();
  if (
    trimmed === '' ||
    trimmed.toUpperCase() === 'ALL' ||
    trimmed === 'undefined' ||
    trimmed === 'null'
  ) {
    return undefined;
  }
  if (!UUID_REGEX.test(trimmed)) {
    throw new BadRequestException(`Invalid UUID format: ${id}`);
  }
  return trimmed;
}

function escapeCsvCell(cell: any): string {
  if (cell === null || cell === undefined) return '';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

@Injectable()
export class ReportingService {
  private readonly db = dbService.db;
  private readonly reportingRepo = new KyselyReportingRepository(this.db);
  private readonly residentReportRepo = new KyselyResidentReportingRepository(this.db);
  private readonly occupancyReportRepo = new KyselyOccupancyReportingRepository(this.db);
  private readonly billingReportRepo = new KyselyBillingReportingRepository(this.db);
  private readonly messReportRepo = new KyselyMessReportingRepository(this.db);
  private readonly inventoryReportRepo = new KyselyInventoryReportingRepository(this.db);
  private readonly financialReportRepo = new KyselyFinancialReportingRepository(this.db);

  public async validateOwnership(organizationId: string, propertyId?: string, buildingId?: string) {
    if (propertyId) {
      const cleanPropId = sanitizeId(propertyId);
      const prop = await this.db
        .selectFrom('properties')
        .select(['id', 'organization_id'])
        .where('id', '=', cleanPropId!)
        .executeTakeFirst();

      if (!prop || prop.organization_id !== organizationId) {
        throw new NotFoundException(`Property ${propertyId} not found for tenant`);
      }
    }

    if (buildingId) {
      const cleanBldgId = sanitizeId(buildingId);
      const bldg = await this.db
        .selectFrom('buildings')
        .select(['id', 'organization_id', 'property_id'])
        .where('id', '=', cleanBldgId!)
        .executeTakeFirst();

      if (!bldg || bldg.organization_id !== organizationId) {
        throw new NotFoundException(`Building ${buildingId} not found for tenant`);
      }

      if (propertyId && bldg.property_id !== sanitizeId(propertyId)) {
        throw new BadRequestException(
          `Building ${buildingId} does not belong to property ${propertyId}`
        );
      }
    }
  }

  private validateDates(filter: ReportFilterDto) {
    if (filter.fromDate && filter.toDate && filter.fromDate > filter.toDate) {
      throw new BadRequestException('fromDate cannot be greater than toDate');
    }
  }

  // --- STEP 19 DETAILED REPORT METHODS ---

  public async getResidentReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<ResidentReportResponseDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    this.validateDates(filter);
    return this.residentReportRepo.getResidentReport(organizationId, filter);
  }

  public async exportResidentReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getResidentReportDetailed(organizationId, { ...filter, pageSize: 10000 });
    const headers = [
      'Resident Code',
      'Full Name',
      'Phone',
      'Email',
      'Status',
      'Stay Status',
      'Property',
      'Building',
      'Floor',
      'Room',
      'Bed',
      'Admission Date',
      'Checkout Date',
      'Mess Status',
      'Outstanding Amount',
    ];
    const rows = report.rows.map((r) => [
      r.residentCode,
      r.fullName,
      r.phone,
      r.email,
      r.status,
      r.stayStatus,
      r.propertyName,
      r.buildingName,
      r.floorNumber,
      r.roomNumber,
      r.bedNumber,
      r.admissionDate,
      r.checkoutDate,
      r.messStatus,
      r.outstandingAmount,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  public async getOccupancyReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<OccupancyReportResponseDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    return this.occupancyReportRepo.getOccupancyReport(organizationId, filter);
  }

  public async exportOccupancyReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getOccupancyReportDetailed(organizationId, filter);
    const headers = [
      'Property',
      'Building',
      'Floor Number',
      'Room Number',
      'Capacity',
      'Total Beds',
      'Occupied Beds',
      'Available Beds',
      'Occupancy %',
    ];
    const rows = report.rows.map((r) => [
      r.propertyName,
      r.buildingName,
      r.floorNumber,
      r.roomNumber,
      r.capacity,
      r.totalBeds,
      r.occupiedBeds,
      r.availableBeds,
      `${r.occupancyPercentage}%`,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  public async getBillingReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<BillingReportResponseDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    this.validateDates(filter);
    return this.billingReportRepo.getBillingReport(organizationId, filter);
  }

  public async exportBillingReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getBillingReportDetailed(organizationId, { ...filter, pageSize: 10000 });
    const headers = [
      'Invoice Number',
      'Resident Name',
      'Resident Code',
      'Property',
      'Building',
      'Billing Period',
      'Status',
      'Invoice Total',
      'Paid Amount',
      'Balance Due',
      'Due Date',
    ];
    const rows = report.rows.map((r) => [
      r.invoiceNumber,
      r.residentName,
      r.residentCode,
      r.propertyName,
      r.buildingName,
      r.billingPeriod,
      r.invoiceStatus,
      r.invoiceTotal,
      r.paidAmount,
      r.balanceDue,
      r.dueDate,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  public async getCollectionReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<CollectionReportResponseDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    this.validateDates(filter);
    return this.billingReportRepo.getCollectionReport(organizationId, filter);
  }

  public async exportCollectionReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getCollectionReportDetailed(organizationId, { ...filter, pageSize: 10000 });
    const headers = [
      'Receipt Number',
      'Resident Name',
      'Resident Code',
      'Invoice Number',
      'Amount',
      'Payment Method',
      'Reference',
      'Payment Date',
      'Status',
    ];
    const rows = report.rows.map((r) => [
      r.receiptNumber,
      r.residentName,
      r.residentCode,
      r.invoiceNumber,
      r.amount,
      r.paymentMethod,
      r.reference,
      r.paymentDate,
      r.status,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  public async getOutstandingReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<OutstandingReportResponseDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    return this.billingReportRepo.getOutstandingReport(organizationId, filter);
  }

  public async exportOutstandingReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getOutstandingReportDetailed(organizationId, { ...filter, pageSize: 10000 });
    const headers = [
      'Resident Code',
      'Resident Name',
      'Phone',
      'Property',
      'Building',
      'Room',
      'Bed',
      'Invoice Count',
      'Total Invoiced',
      'Total Paid',
      'Balance Due',
      'Oldest Due Date',
      'Days Outstanding',
    ];
    const rows = report.rows.map((r) => [
      r.residentCode,
      r.residentName,
      r.phone,
      r.propertyName,
      r.buildingName,
      r.roomNumber,
      r.bedNumber,
      r.invoiceCount,
      r.totalInvoiced,
      r.totalPaid,
      r.balanceDue,
      r.oldestDueDate,
      r.daysOutstanding,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  public async getMessReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<MessReportResponseDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    return this.messReportRepo.getMessReport(organizationId, filter);
  }

  public async exportMessReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getMessReportDetailed(organizationId, { ...filter, pageSize: 10000 });
    const headers = [
      'Resident Code',
      'Resident Name',
      'Mess Name',
      'Meal Plan Name',
      'Subscription Status',
      'Monthly Price',
      'Start Date',
      'End Date',
      'Consumption Count',
    ];
    const rows = report.rows.map((r) => [
      r.residentCode,
      r.residentName,
      r.messName,
      r.mealPlanName,
      r.subscriptionStatus,
      r.monthlyPrice,
      r.startDate,
      r.endDate,
      r.consumptionCount,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  public async getInventoryReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<InventoryReportResponseDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    return this.inventoryReportRepo.getInventoryReport(organizationId, filter);
  }

  public async exportInventoryReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getInventoryReportDetailed(organizationId, { ...filter, pageSize: 10000 });
    const headers = [
      'Item Name',
      'Category',
      'Unit',
      'Current Stock',
      'Minimum Stock',
      'Status',
      'Total Procured Qty',
      'Total Consumed Qty',
      'Total Procurement Value',
    ];
    const rows = report.rows.map((r) => [
      r.itemName,
      r.category,
      r.unit,
      r.currentStock,
      r.minimumStock,
      r.status,
      r.totalProcuredQuantity,
      r.totalConsumedQuantity,
      r.totalProcurementValue,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  public async getProcurementReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<ProcurementReportResponseDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    this.validateDates(filter);
    return this.inventoryReportRepo.getProcurementReport(organizationId, filter);
  }

  public async exportProcurementReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getProcurementReportDetailed(organizationId, { ...filter, pageSize: 10000 });
    const headers = [
      'Invoice Reference',
      'Vendor Name',
      'Procurement Date',
      'Total Amount',
      'Item Count',
    ];
    const rows = report.rows.map((r) => [
      r.invoiceReference,
      r.vendorName,
      r.procurementDate,
      r.totalAmount,
      r.itemCount,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  public async getExpenseReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<ExpenseReportResponseDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    this.validateDates(filter);
    return this.financialReportRepo.getExpenseReport(organizationId, filter);
  }

  public async exportExpenseReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getExpenseReportDetailed(organizationId, { ...filter, pageSize: 10000 });
    const headers = [
      'Category',
      'Description',
      'Vendor Name',
      'Expense Date',
      'Amount',
    ];
    const rows = report.rows.map((r) => [
      r.category,
      r.description,
      r.vendorName,
      r.expenseDate,
      r.amount,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  public async getPropertyPerformanceReportDetailed(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<PropertyPerformanceReportDto> {
    await this.validateOwnership(organizationId, filter.propertyId, filter.buildingId);
    return this.financialReportRepo.getPropertyPerformanceReport(organizationId, filter);
  }

  public async exportPropertyPerformanceReportCsv(
    organizationId: string,
    filter: ReportFilterDto
  ): Promise<string> {
    const report = await this.getPropertyPerformanceReportDetailed(organizationId, filter);
    const headers = [
      'Property Name',
      'Building Name',
      'Total Rooms',
      'Total Beds',
      'Occupied Beds',
      'Occupancy %',
      'Active Residents',
      'Total Invoiced',
      'Total Collected',
      'Total Outstanding',
      'Total Expenses',
      'Net Cash Flow',
      'Active Mess Subs',
      'Low Stock Items',
    ];
    const rows = report.items.map((r) => [
      r.propertyName,
      r.buildingName,
      r.totalRooms,
      r.totalBeds,
      r.occupiedBeds,
      `${r.occupancyPercentage}%`,
      r.activeResidents,
      r.totalInvoiced,
      r.totalCollected,
      r.totalOutstanding,
      r.totalExpenses,
      r.netCashFlow,
      r.activeMessSubscriptions,
      r.lowStockItems,
    ]);
    return [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n');
  }

  // --- DASHBOARD METHODS ---

  public async getDashboardOverview(
    organizationId: string,
    propertyId?: string,
    buildingId?: string,
    period?: string,
    preset: DateRangePresetDto = 'THIS_MONTH',
    customStartDate?: string,
    customEndDate?: string
  ): Promise<DashboardOverviewDto> {
    const cleanPropId = sanitizeId(propertyId);
    const cleanBldgId = sanitizeId(buildingId);
    await this.validateOwnership(organizationId, cleanPropId, cleanBldgId);

    const dateRange = this.resolveDateRange(period, preset, customStartDate, customEndDate);

    const occupancy = await this.getOccupancyReport(organizationId, cleanPropId, cleanBldgId);
    const residents = await this.getResidentReport(
      organizationId,
      cleanPropId,
      cleanBldgId,
      dateRange.startDate,
      dateRange.endDate
    );
    const billing = await this.getBillingReport(
      organizationId,
      cleanPropId,
      cleanBldgId,
      dateRange.startDate,
      dateRange.endDate
    );
    const mess = await this.getMessReport(
      organizationId,
      cleanPropId,
      cleanBldgId,
      dateRange.startDate,
      dateRange.endDate
    );
    const expenses = await this.getExpenseReport(
      organizationId,
      cleanPropId,
      cleanBldgId,
      dateRange.startDate,
      dateRange.endDate
    );
    const alerts = await this.getOperationalAlerts(organizationId, cleanPropId, cleanBldgId);
    const recentActivity = await this.getActivityReport(organizationId, cleanPropId, cleanBldgId, 15);

    return {
      dateRange,
      occupancy,
      residents,
      billing: {
        ...billing,
        netCashFlow: billing.totalCollected - expenses.currentMonthExpenses,
      },
      mess,
      expenses,
      alerts,
      recentActivity,
    };
  }

  public async getOccupancyReport(
    organizationId: string,
    propertyId?: string,
    buildingId?: string
  ): Promise<OccupancyReportDto> {
    const cleanPropId = sanitizeId(propertyId);
    const cleanBldgId = sanitizeId(buildingId);
    await this.validateOwnership(organizationId, cleanPropId, cleanBldgId);

    const res = await this.reportingRepo.getOccupancyMetrics(organizationId, cleanPropId, cleanBldgId);
    return {
      totalProperties: res.totalProperties,
      totalBuildings: res.totalBuildings,
      totalFloors: res.totalFloors,
      totalRooms: res.totalRooms,
      totalBeds: res.totalBeds,
      availableBeds: res.availableBeds,
      occupiedBeds: res.occupiedBeds,
      maintenanceBeds: res.maintenanceBeds,
      inactiveBeds: res.inactiveBeds,
      occupancyPercentage: res.occupancyPercentage,
    };
  }

  public async getResidentReport(
    organizationId: string,
    propertyId?: string,
    buildingId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ResidentReportDto> {
    const cleanPropId = sanitizeId(propertyId);
    const cleanBldgId = sanitizeId(buildingId);
    await this.validateOwnership(organizationId, cleanPropId, cleanBldgId);

    const res = await this.reportingRepo.getResidentMetrics(
      organizationId,
      cleanPropId,
      cleanBldgId,
      startDate,
      endDate
    );
    return {
      totalActiveResidents: res.totalActiveResidents,
      totalInactiveResidents: res.totalInactiveResidents,
      currentCheckedInResidents: res.currentCheckedInResidents,
      checkedOutResidents: res.checkedOutResidents,
      residentsWithoutStay: res.residentsWithoutStay,
      newAdmissionsInPeriod: res.newAdmissionsInPeriod,
      checkoutsInPeriod: res.checkoutsInPeriod,
      transfersInPeriod: res.transfersInPeriod,
    };
  }

  public async getBillingReport(
    organizationId: string,
    propertyId?: string,
    buildingId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<BillingReportDto> {
    const cleanPropId = sanitizeId(propertyId);
    const cleanBldgId = sanitizeId(buildingId);
    await this.validateOwnership(organizationId, cleanPropId, cleanBldgId);

    const res = await this.reportingRepo.getBillingMetrics(
      organizationId,
      cleanPropId,
      cleanBldgId,
      startDate,
      endDate
    );
    const totalCollected = res.totalCollectedPaise / 100;
    const expensesRes = await this.reportingRepo.getExpenseMetrics(
      organizationId,
      cleanPropId,
      cleanBldgId,
      startDate,
      endDate
    );
    const currentExpenses = expensesRes.currentMonthExpensesPaise / 100;

    return {
      totalInvoiced: res.totalInvoicedPaise / 100,
      totalCollected,
      totalOutstanding: res.totalOutstandingPaise / 100,
      overdueAmount: res.overdueAmountPaise / 100,
      partiallyPaidAmount: res.partiallyPaidAmountPaise / 100,
      paidInvoiceCount: res.paidInvoiceCount,
      unpaidInvoiceCount: res.unpaidInvoiceCount,
      overdueInvoiceCount: res.overdueInvoiceCount,
      collectionPercentage: res.collectionPercentage,
      netCashFlow: totalCollected - currentExpenses,
    };
  }

  public async getMessReport(
    organizationId: string,
    propertyId?: string,
    buildingId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<MessReportDto> {
    const cleanPropId = sanitizeId(propertyId);
    const cleanBldgId = sanitizeId(buildingId);
    await this.validateOwnership(organizationId, cleanPropId, cleanBldgId);

    const res = await this.reportingRepo.getMessMetrics(
      organizationId,
      cleanPropId,
      cleanBldgId,
      startDate,
      endDate
    );
    return {
      activeMessSubscribers: res.activeMessSubscribers,
      expectedMealsToday: res.expectedMealsToday,
      mealsConsumedToday: res.mealsConsumedToday,
      mealsSkippedToday: res.mealsSkippedToday,
      consumptionPercentage: res.consumptionPercentage,
      currentInventoryValue: res.currentInventoryValuePaise / 100,
      totalInventoryItems: res.totalInventoryItems,
      lowStockItemCount: res.lowStockItemCount,
      outOfStockItemCount: res.outOfStockItemCount,
      currentMonthProcurementAmount: res.currentMonthProcurementPaise / 100,
      currentMonthMessExpenseAmount: res.currentMonthMessExpensePaise / 100,
    };
  }

  public async getExpenseReport(
    organizationId: string,
    propertyId?: string,
    buildingId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ExpenseReportDto> {
    const cleanPropId = sanitizeId(propertyId);
    const cleanBldgId = sanitizeId(buildingId);
    await this.validateOwnership(organizationId, cleanPropId, cleanBldgId);

    const res = await this.reportingRepo.getExpenseMetrics(
      organizationId,
      cleanPropId,
      cleanBldgId,
      startDate,
      endDate
    );
    return {
      currentMonthExpenses: res.currentMonthExpensesPaise / 100,
      previousMonthExpenses: res.previousMonthExpensesPaise / 100,
      messExpenses: res.messExpensesPaise / 100,
      maintenanceExpenses: res.maintenanceExpensesPaise / 100,
      utilitiesExpenses: res.utilitiesExpensesPaise / 100,
      otherExpenses: res.otherExpensesPaise / 100,
      categories: res.categories.map((c) => ({
        category: c.category,
        count: 1,
        totalAmount: c.amountPaise / 100,
      })),
    };
  }

  public async getActivityReport(
    organizationId: string,
    propertyId?: string,
    buildingId?: string,
    limit = 20
  ): Promise<ActivityItemDto[]> {
    const cleanPropId = sanitizeId(propertyId);
    const cleanBldgId = sanitizeId(buildingId);
    await this.validateOwnership(organizationId, cleanPropId, cleanBldgId);

    const items = await this.reportingRepo.getRecentActivity(organizationId, cleanPropId, cleanBldgId, limit);
    return items.map((it) => ({
      id: it.id,
      type: it.type,
      title: it.title,
      description: it.description,
      timestamp: it.timestamp,
      entityId: it.entityId,
    }));
  }

  public async getOperationalAlerts(
    organizationId: string,
    propertyId?: string,
    buildingId?: string
  ): Promise<OperationalAlertDto[]> {
    const cleanPropId = sanitizeId(propertyId);
    const cleanBldgId = sanitizeId(buildingId);
    await this.validateOwnership(organizationId, cleanPropId, cleanBldgId);

    const items = await this.reportingRepo.getOperationalAlerts(organizationId, cleanPropId, cleanBldgId);
    return items.map((it) => ({
      id: it.id,
      type: it.type,
      severity: it.severity,
      title: it.title,
      description: it.description,
      count: it.count,
      targetScreen: it.targetScreen,
    }));
  }

  private resolveDateRange(
    period?: string,
    preset: DateRangePresetDto = 'THIS_MONTH',
    customStart?: string,
    customEnd?: string
  ): DateRangeDto {
    if (period && period.trim()) {
      const trimmedPeriod = period.trim();
      if (!PERIOD_REGEX.test(trimmedPeriod)) {
        throw new BadRequestException(`Invalid period format '${period}'. Expected YYYY-MM.`);
      }
      const [yearStr, monthStr] = trimmedPeriod.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;

      const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();
      const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)).toISOString();
      return { preset: 'CUSTOM', startDate, endDate };
    }

    const now = new Date();
    let startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    if (preset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      startDate = start.toISOString();
      endDate = end.toISOString();
    } else if (preset === 'THIS_WEEK') {
      const first = now.getDate() - now.getDay();
      const start = new Date(now.setDate(first));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      startDate = start.toISOString();
      endDate = end.toISOString();
    } else if (preset === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      startDate = start.toISOString();
      endDate = end.toISOString();
    } else if (preset === 'CUSTOM' && customStart && customEnd) {
      startDate = new Date(customStart).toISOString();
      endDate = new Date(customEnd).toISOString();
    }

    return { preset, startDate, endDate };
  }
}
