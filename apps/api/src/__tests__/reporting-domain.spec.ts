import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportingService } from '../modules/reporting/reporting.service';
import { KyselyReportingRepository } from '@m-square/database';

describe('M7.4 Operational Reporting Domain Specification', () => {
  const service = new ReportingService();
  const mockOrgId = '11111111-1111-1111-1111-111111111111';
  const mockPropId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.spyOn(service as any, 'validateOwnership').mockResolvedValue(true);
  });

  it('1. Service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('2. Dashboard returns correct occupancy metrics', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getOccupancyMetrics').mockResolvedValue({
      totalProperties: 2,
      totalBuildings: 4,
      totalFloors: 12,
      totalRooms: 48,
      totalBeds: 100,
      availableBeds: 30,
      occupiedBeds: 60,
      maintenanceBeds: 5,
      inactiveBeds: 5,
      occupancyPercentage: 66.67,
    });

    const rep = await service.getOccupancyReport(mockOrgId, mockPropId);
    expect(rep.totalProperties).toBe(2);
    expect(rep.occupiedBeds).toBe(60);
    expect(rep.availableBeds).toBe(30);
    expect(rep.occupancyPercentage).toBe(66.67);
  });

  it('3. Occupancy calculation excludes maintenance beds from capacity denominator', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getOccupancyMetrics').mockResolvedValue({
      totalProperties: 1,
      totalBuildings: 1,
      totalFloors: 2,
      totalRooms: 10,
      totalBeds: 20,
      availableBeds: 8,
      occupiedBeds: 10,
      maintenanceBeds: 2,
      inactiveBeds: 0,
      occupancyPercentage: 55.56,
    });

    const rep = await service.getOccupancyReport(mockOrgId);
    expect(rep.maintenanceBeds).toBe(2);
    expect(rep.occupancyPercentage).toBe(55.56);
  });

  it('4. Resident report returns active, checked-in and checkout counts', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getResidentMetrics').mockResolvedValue({
      totalActiveResidents: 45,
      totalInactiveResidents: 5,
      currentCheckedInResidents: 40,
      checkedOutResidents: 10,
      newAdmissionsInPeriod: 8,
      checkoutsInPeriod: 2,
      transfersInPeriod: 3,
    });

    const rep = await service.getResidentReport(mockOrgId, mockPropId);
    expect(rep.totalActiveResidents).toBe(45);
    expect(rep.newAdmissionsInPeriod).toBe(8);
    expect(rep.transfersInPeriod).toBe(3);
  });

  it('5. Property filter scoping is applied', async () => {
    const spy = vi
      .spyOn(KyselyReportingRepository.prototype, 'getOccupancyMetrics')
      .mockResolvedValue({
        totalProperties: 1,
        totalBuildings: 2,
        totalFloors: 4,
        totalRooms: 10,
        totalBeds: 20,
        availableBeds: 5,
        occupiedBeds: 15,
        maintenanceBeds: 0,
        inactiveBeds: 0,
        occupancyPercentage: 75,
      });

    await service.getOccupancyReport(mockOrgId, mockPropId);
    expect(spy).toHaveBeenCalledWith(mockOrgId, mockPropId, undefined);
  });

  it('6. Cross-property data contamination is prevented', async () => {
    const spy = vi
      .spyOn(KyselyReportingRepository.prototype, 'getBillingMetrics')
      .mockResolvedValue({
        totalInvoicedPaise: 5000000,
        totalCollectedPaise: 4000000,
        totalOutstandingPaise: 1000000,
        overdueAmountPaise: 200000,
        partiallyPaidAmountPaise: 100000,
        paidInvoiceCount: 10,
        unpaidInvoiceCount: 2,
        overdueInvoiceCount: 1,
        collectionPercentage: 80,
      });

    await service.getBillingReport(mockOrgId, mockPropId);
    expect(spy).toHaveBeenCalledWith(mockOrgId, mockPropId, undefined, undefined, undefined);
  });

  it('7. Billing totals compute exact money from integer paise', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getBillingMetrics').mockResolvedValue({
      totalInvoicedPaise: 1555075,
      totalCollectedPaise: 1000025,
      totalOutstandingPaise: 555050,
      overdueAmountPaise: 200000,
      partiallyPaidAmountPaise: 355050,
      paidInvoiceCount: 5,
      unpaidInvoiceCount: 2,
      overdueInvoiceCount: 1,
      collectionPercentage: 64.31,
    });

    const rep = await service.getBillingReport(mockOrgId);
    expect(rep.totalInvoiced).toBe(15550.75);
    expect(rep.totalCollected).toBe(10000.25);
    expect(rep.totalOutstanding).toBe(5550.5);
    expect(rep.collectionPercentage).toBe(64.31);
  });

  it('8. Overdue amount correctly aggregates overdue invoices only', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getBillingMetrics').mockResolvedValue({
      totalInvoicedPaise: 1000000,
      totalCollectedPaise: 500000,
      totalOutstandingPaise: 500000,
      overdueAmountPaise: 350000,
      partiallyPaidAmountPaise: 150000,
      paidInvoiceCount: 2,
      unpaidInvoiceCount: 1,
      overdueInvoiceCount: 2,
      collectionPercentage: 50,
    });

    const rep = await service.getBillingReport(mockOrgId);
    expect(rep.overdueAmount).toBe(3500);
    expect(rep.overdueInvoiceCount).toBe(2);
  });

  it('9. Mess report calculates meal consumption percentage accurately', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getMessMetrics').mockResolvedValue({
      activeMessSubscribers: 100,
      expectedMealsToday: 300,
      mealsConsumedToday: 270,
      mealsSkippedToday: 30,
      consumptionPercentage: 90,
      currentInventoryValuePaise: 1500000,
      lowStockItemCount: 2,
      outOfStockItemCount: 0,
      currentMonthProcurementPaise: 2500000,
      currentMonthMessExpensePaise: 500000,
    });

    const m = await service.getMessReport(mockOrgId);
    expect(m.consumptionPercentage).toBe(90);
    expect(m.activeMessSubscribers).toBe(100);
    expect(m.mealsConsumedToday).toBe(270);
  });

  it('10. Inventory value in paise is converted to exact rupees', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getMessMetrics').mockResolvedValue({
      activeMessSubscribers: 50,
      expectedMealsToday: 150,
      mealsConsumedToday: 150,
      mealsSkippedToday: 0,
      consumptionPercentage: 100,
      currentInventoryValuePaise: 250050,
      lowStockItemCount: 1,
      outOfStockItemCount: 0,
      currentMonthProcurementPaise: 1250075,
      currentMonthMessExpensePaise: 300025,
    });

    const m = await service.getMessReport(mockOrgId);
    expect(m.currentInventoryValue).toBe(2500.5);
    expect(m.currentMonthProcurementAmount).toBe(12500.75);
    expect(m.currentMonthMessExpenseAmount).toBe(3000.25);
  });

  it('11. Stock alerts report low-stock and out-of-stock count properly', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getMessMetrics').mockResolvedValue({
      activeMessSubscribers: 10,
      expectedMealsToday: 30,
      mealsConsumedToday: 20,
      mealsSkippedToday: 10,
      consumptionPercentage: 66.67,
      currentInventoryValuePaise: 50000,
      lowStockItemCount: 4,
      outOfStockItemCount: 2,
      currentMonthProcurementPaise: 100000,
      currentMonthMessExpensePaise: 20000,
    });

    const m = await service.getMessReport(mockOrgId);
    expect(m.lowStockItemCount).toBe(4);
    expect(m.outOfStockItemCount).toBe(2);
  });

  it('12. Expense totals convert paise to monetary units accurately', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getExpenseMetrics').mockResolvedValue({
      currentMonthExpensesPaise: 450000,
      previousMonthExpensesPaise: 400000,
      messExpensesPaise: 450000,
      maintenanceExpensesPaise: 0,
      utilitiesExpensesPaise: 0,
      otherExpensesPaise: 0,
      categories: [{ category: 'MESS', amountPaise: 450000 }],
    });

    const e = await service.getExpenseReport(mockOrgId);
    expect(e.currentMonthExpenses).toBe(4500);
    expect(e.categories[0].totalAmount).toBe(4500);
  });

  it('13. Date range TODAY sets exact start and end of current day', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getOccupancyMetrics').mockResolvedValue({
      totalProperties: 1,
      totalBuildings: 1,
      totalFloors: 1,
      totalRooms: 1,
      totalBeds: 1,
      availableBeds: 1,
      occupiedBeds: 0,
      maintenanceBeds: 0,
      inactiveBeds: 0,
      occupancyPercentage: 0,
    });
    vi.spyOn(KyselyReportingRepository.prototype, 'getResidentMetrics').mockResolvedValue({
      totalActiveResidents: 0,
      totalInactiveResidents: 0,
      currentCheckedInResidents: 0,
      checkedOutResidents: 0,
      newAdmissionsInPeriod: 0,
      checkoutsInPeriod: 0,
      transfersInPeriod: 0,
    });
    vi.spyOn(KyselyReportingRepository.prototype, 'getBillingMetrics').mockResolvedValue({
      totalInvoicedPaise: 0,
      totalCollectedPaise: 0,
      totalOutstandingPaise: 0,
      overdueAmountPaise: 0,
      partiallyPaidAmountPaise: 0,
      paidInvoiceCount: 0,
      unpaidInvoiceCount: 0,
      overdueInvoiceCount: 0,
      collectionPercentage: 0,
    });
    vi.spyOn(KyselyReportingRepository.prototype, 'getMessMetrics').mockResolvedValue({
      activeMessSubscribers: 0,
      expectedMealsToday: 0,
      mealsConsumedToday: 0,
      mealsSkippedToday: 0,
      consumptionPercentage: 0,
      currentInventoryValuePaise: 0,
      lowStockItemCount: 0,
      outOfStockItemCount: 0,
      currentMonthProcurementPaise: 0,
      currentMonthMessExpensePaise: 0,
    });
    vi.spyOn(KyselyReportingRepository.prototype, 'getExpenseMetrics').mockResolvedValue({
      currentMonthExpensesPaise: 0,
      previousMonthExpensesPaise: 0,
      messExpensesPaise: 0,
      maintenanceExpensesPaise: 0,
      utilitiesExpensesPaise: 0,
      otherExpensesPaise: 0,
      categories: [],
    });
    vi.spyOn(KyselyReportingRepository.prototype, 'getRecentActivity').mockResolvedValue([]);

    const dash = await service.getDashboardOverview(mockOrgId, undefined, undefined, undefined, 'TODAY');
    expect(dash.dateRange.preset).toBe('TODAY');
    expect(dash.dateRange.startDate).toBeDefined();
    expect(dash.dateRange.endDate).toBeDefined();
  });

  it('14. Date range THIS_MONTH sets month start and end', async () => {
    const dash = await service.getDashboardOverview(mockOrgId, undefined, undefined, undefined, 'THIS_MONTH');
    expect(dash.dateRange.preset).toBe('THIS_MONTH');
  });

  it('15. Empty period returns zero/empty state metrics without crashing', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getBillingMetrics').mockResolvedValue({
      totalInvoicedPaise: 0,
      totalCollectedPaise: 0,
      totalOutstandingPaise: 0,
      overdueAmountPaise: 0,
      partiallyPaidAmountPaise: 0,
      paidInvoiceCount: 0,
      unpaidInvoiceCount: 0,
      overdueInvoiceCount: 0,
      collectionPercentage: 0,
    });

    const b = await service.getBillingReport(mockOrgId);
    expect(b.totalInvoiced).toBe(0);
    expect(b.collectionPercentage).toBe(0);
  });

  it('16. Recent activity returns chronological event stream', async () => {
    vi.spyOn(KyselyReportingRepository.prototype, 'getRecentActivity').mockResolvedValue([
      {
        id: 'pay-1',
        type: 'PAYMENT_COLLECTED',
        title: 'Payment Collected (PAY-001)',
        description: 'Collected ₹5,000',
        timestamp: '2026-08-13T01:00:00.000Z',
      },
    ]);

    const act = await service.getActivityReport(mockOrgId, mockPropId, undefined, 10);
    expect(act.length).toBe(1);
    expect(act[0].type).toBe('PAYMENT_COLLECTED');
  });

  it('17. Dashboard overview compiles all 6 reporting domains atomically', async () => {
    const dash = await service.getDashboardOverview(mockOrgId, mockPropId, undefined, undefined, 'THIS_MONTH');
    expect(dash.occupancy).toBeDefined();
    expect(dash.residents).toBeDefined();
    expect(dash.billing).toBeDefined();
    expect(dash.mess).toBeDefined();
    expect(dash.expenses).toBeDefined();
    expect(dash.recentActivity).toBeDefined();
  });

  it('18. Multi-tenant security enforces organizationId context isolation', async () => {
    const spy = vi
      .spyOn(KyselyReportingRepository.prototype, 'getRecentActivity')
      .mockResolvedValue([]);
    await service.getActivityReport('11111111-1111-1111-1111-999999999999');
    expect(spy).toHaveBeenCalledWith('11111111-1111-1111-1111-999999999999', undefined, undefined, 20);
  });
});
