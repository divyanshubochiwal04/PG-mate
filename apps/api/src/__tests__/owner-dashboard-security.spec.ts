import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportingService } from '../modules/reporting/reporting.service';

describe('Owner Command Center & Dashboard Security Specification', () => {
  const mockDb = {
    selectFrom: vi.fn(),
  };

  const orgA = '11111111-1111-1111-1111-111111111111';
  const orgB = '22222222-2222-2222-2222-222222222222';
  const propA = '33333333-3333-3333-3333-333333333333';
  const propB = '44444444-4444-4444-4444-444444444444';
  const bldgA = '55555555-5555-5555-5555-555555555555';
  const bldgB = '66666666-6666-6666-6666-666666666666';

  let service: ReportingService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new ReportingService();

    // Mock db on service
    (service as any).db = mockDb;
    (service as any).reportingRepo = {
      getOccupancyMetrics: vi.fn().mockResolvedValue({
        totalProperties: 1,
        totalBuildings: 1,
        totalFloors: 2,
        totalRooms: 5,
        totalBeds: 20,
        availableBeds: 5,
        occupiedBeds: 15,
        maintenanceBeds: 0,
        inactiveBeds: 0,
        occupancyPercentage: 75,
      }),
      getResidentMetrics: vi.fn().mockResolvedValue({
        totalActiveResidents: 15,
        totalInactiveResidents: 0,
        currentCheckedInResidents: 15,
        checkedOutResidents: 2,
        residentsWithoutStay: 0,
        newAdmissionsInPeriod: 3,
        checkoutsInPeriod: 1,
        transfersInPeriod: 0,
      }),
      getBillingMetrics: vi.fn().mockResolvedValue({
        totalInvoicedPaise: 1500000,
        totalCollectedPaise: 1000000,
        totalOutstandingPaise: 500000,
        overdueAmountPaise: 100000,
        partiallyPaidAmountPaise: 200000,
        paidInvoiceCount: 5,
        unpaidInvoiceCount: 2,
        overdueInvoiceCount: 1,
        collectionPercentage: 66.67,
      }),
      getMessMetrics: vi.fn().mockResolvedValue({
        activeMessSubscribers: 12,
        expectedMealsToday: 36,
        mealsConsumedToday: 30,
        mealsSkippedToday: 6,
        consumptionPercentage: 83.33,
        currentInventoryValuePaise: 500000,
        totalInventoryItems: 10,
        lowStockItemCount: 2,
        outOfStockItemCount: 0,
        currentMonthProcurementPaise: 200000,
        currentMonthMessExpensePaise: 150000,
      }),
      getExpenseMetrics: vi.fn().mockResolvedValue({
        currentMonthExpensesPaise: 300000,
        previousMonthExpensesPaise: 250000,
        messExpensesPaise: 150000,
        maintenanceExpensesPaise: 50000,
        utilitiesExpensesPaise: 100000,
        otherExpensesPaise: 0,
        categories: [{ category: 'MESS', amountPaise: 150000 }],
      }),
      getRecentActivity: vi.fn().mockResolvedValue([
        {
          id: 'pay-1',
          type: 'PAYMENT_COLLECTED',
          title: 'Payment Collected (PAY-001)',
          description: 'Collected ₹5,000',
          timestamp: '2026-08-14T10:00:00.000Z',
          entityId: 'pay-1',
        },
      ]),
      getOperationalAlerts: vi.fn().mockResolvedValue([
        {
          id: 'alert-low-stock',
          type: 'LOW_STOCK',
          severity: 'WARNING',
          title: 'Low Stock Warning',
          description: '2 kitchen items low stock',
          count: 2,
          targetScreen: '/(owner)/inventory',
        },
      ]),
    };
  });

  it('DASH-SEC-01: Own tenant dashboard returns correct data', async () => {
    const data = await service.getDashboardOverview(orgA);
    expect(data.occupancy.occupiedBeds).toBe(15);
    expect(data.billing.totalCollected).toBe(10000);
    expect(data.billing.netCashFlow).toBe(7000);
    expect(data.alerts.length).toBe(1);
  });

  it('DASH-SEC-02: Cross-tenant property filter rejected with NotFoundException', async () => {
    mockDb.selectFrom.mockReturnValueOnce({
      select: () => ({
        where: () => ({
          executeTakeFirst: async () => null, // Property belongs to Org B
        }),
      }),
    });

    await expect(service.getDashboardOverview(orgA, propB)).rejects.toThrow(
      NotFoundException
    );
  });

  it('DASH-SEC-03: Cross-tenant building filter rejected with NotFoundException', async () => {
    mockDb.selectFrom.mockReturnValueOnce({
      select: () => ({
        where: () => ({
          executeTakeFirst: async () => null, // Building belongs to Org B
        }),
      }),
    });

    await expect(service.getDashboardOverview(orgA, undefined, bldgB)).rejects.toThrow(
      NotFoundException
    );
  });

  it('DASH-SEC-04: Resident counts tenant scoped', async () => {
    const data = await service.getResidentReport(orgA);
    expect(data.totalActiveResidents).toBe(15);
    expect((service as any).reportingRepo.getResidentMetrics).toHaveBeenCalledWith(
      orgA,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });

  it('DASH-SEC-05: Billing totals tenant scoped', async () => {
    const data = await service.getBillingReport(orgA);
    expect(data.totalInvoiced).toBe(15000);
    expect((service as any).reportingRepo.getBillingMetrics).toHaveBeenCalledWith(
      orgA,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });

  it('DASH-SEC-06: Inventory totals tenant scoped', async () => {
    const data = await service.getMessReport(orgA);
    expect(data.totalInventoryItems).toBe(10);
    expect((service as any).reportingRepo.getMessMetrics).toHaveBeenCalledWith(
      orgA,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });

  it('DASH-SEC-07: Expense totals tenant scoped', async () => {
    const data = await service.getExpenseReport(orgA);
    expect(data.currentMonthExpenses).toBe(3000);
    expect((service as any).reportingRepo.getExpenseMetrics).toHaveBeenCalledWith(
      orgA,
      undefined,
      undefined,
      undefined,
      undefined
    );
  });

  it('DASH-SEC-08: Mess totals tenant scoped', async () => {
    const data = await service.getMessReport(orgA);
    expect(data.activeMessSubscribers).toBe(12);
  });

  it('DASH-SEC-09: Invalid UUID query parameter rejected with BadRequestException', async () => {
    await expect(service.getDashboardOverview(orgA, 'not-a-valid-uuid')).rejects.toThrow(
      BadRequestException
    );
  });

  it('DASH-SEC-10: Invalid billing period format rejected with BadRequestException', async () => {
    await expect(
      service.getDashboardOverview(orgA, undefined, undefined, '2026-13-99')
    ).rejects.toThrow(BadRequestException);
  });

  it('DASH-SEC-11: Property/building mismatch rejected with BadRequestException', async () => {
    mockDb.selectFrom
      .mockReturnValueOnce({
        select: () => ({
          where: () => ({
            executeTakeFirst: async () => ({ id: propA, organization_id: orgA }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: () => ({
          where: () => ({
            executeTakeFirst: async () => ({ id: bldgA, organization_id: orgA, property_id: propB }),
          }),
        }),
      });

    await expect(service.getDashboardOverview(orgA, propA, bldgA)).rejects.toThrow(
      BadRequestException
    );
  });

  it('DASH-SEC-12: Recent activity log cannot expose another tenant activity stream', async () => {
    await service.getActivityReport(orgA);
    expect((service as any).reportingRepo.getRecentActivity).toHaveBeenCalledWith(
      orgA,
      undefined,
      undefined,
      20
    );
  });
});
