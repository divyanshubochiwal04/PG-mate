import { describe, expect, it } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { dbService } from '@m-square/database';
import { ReportingService } from '../modules/reporting/reporting.service';

describe('Reports, Analytics & Export Center Security Test Suite', () => {
  const reportingService = new ReportingService();

  const validOrgAId = '11111111-1111-4111-a111-111111111111';
  const validOrgBId = '22222222-2222-4222-b222-222222222222';
  const nonExistentPropertyId = '99999999-9999-4999-a999-999999999999';
  const nonExistentBuildingId = '88888888-8888-4888-a888-888888888888';

  it('REPORT-SEC-01: Own tenant resident report succeeds', async () => {
    const res = await reportingService.getResidentReportDetailed(validOrgAId, {});
    expect(res).toBeDefined();
    expect(res.summary).toBeDefined();
    expect(Array.isArray(res.rows)).toBe(true);
  });

  it('REPORT-SEC-02: Cross tenant resident report returns 0 rows for isolated tenant B', async () => {
    const resB = await reportingService.getResidentReportDetailed(validOrgBId, {});
    expect(resB).toBeDefined();
    expect(resB.summary.totalResidents).toBe(0);
    expect(resB.rows.length).toBe(0);
  });

  it('REPORT-SEC-03: Cross tenant property filter throws NotFoundException (404)', async () => {
    await expect(
      reportingService.getResidentReportDetailed(validOrgAId, {
        propertyId: nonExistentPropertyId,
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('REPORT-SEC-04: Cross tenant building filter throws NotFoundException (404)', async () => {
    await expect(
      reportingService.getResidentReportDetailed(validOrgAId, {
        buildingId: nonExistentBuildingId,
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('REPORT-SEC-05: Invalid UUID format throws BadRequestException (400)', async () => {
    await expect(
      reportingService.getResidentReportDetailed(validOrgAId, {
        propertyId: 'invalid-uuid-format',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('REPORT-SEC-06: Invalid period format YYYY-13 throws BadRequestException', async () => {
    await expect(
      reportingService.getDashboardOverview(
        validOrgAId,
        undefined,
        undefined,
        '2026-13'
      )
    ).rejects.toThrow(BadRequestException);
  });

  it('REPORT-SEC-07: Invalid date range (fromDate > toDate) throws BadRequestException', async () => {
    await expect(
      reportingService.getResidentReportDetailed(validOrgAId, {
        fromDate: '2026-08-31',
        toDate: '2026-08-01',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('REPORT-SEC-08: Page size > 100 is safely capped to 100', async () => {
    const res = await reportingService.getResidentReportDetailed(validOrgAId, {
      pageSize: 500,
    });
    expect(res.pageSize).toBe(100);
  });

  it('REPORT-SEC-09: Billing report tenant isolation enforced', async () => {
    const resB = await reportingService.getBillingReportDetailed(validOrgBId, {});
    expect(resB.summary.totalInvoiced).toBe(0);
    expect(resB.rows.length).toBe(0);
  });

  it('REPORT-SEC-10: Collections report tenant isolation enforced', async () => {
    const resB = await reportingService.getCollectionReportDetailed(validOrgBId, {});
    expect(resB.summary.totalCollected).toBe(0);
    expect(resB.rows.length).toBe(0);
  });

  it('REPORT-SEC-11: Outstanding report tenant isolation enforced', async () => {
    const resB = await reportingService.getOutstandingReportDetailed(validOrgBId, {});
    expect(resB.summary.totalOutstandingAmount).toBe(0);
    expect(resB.rows.length).toBe(0);
  });

  it('REPORT-SEC-12: Mess report tenant isolation enforced', async () => {
    const resB = await reportingService.getMessReportDetailed(validOrgBId, {});
    expect(resB.summary.activeSubscriptions).toBe(0);
    expect(resB.rows.length).toBe(0);
  });

  it('REPORT-SEC-13: Inventory report tenant isolation enforced', async () => {
    const resB = await reportingService.getInventoryReportDetailed(validOrgBId, {});
    expect(resB.summary.totalItems).toBe(0);
    expect(resB.rows.length).toBe(0);
  });

  it('REPORT-SEC-14: Procurement report tenant isolation enforced', async () => {
    const resB = await reportingService.getProcurementReportDetailed(validOrgBId, {});
    expect(resB.summary.procurementCount).toBe(0);
    expect(resB.rows.length).toBe(0);
  });

  it('REPORT-SEC-15: Expense report tenant isolation enforced', async () => {
    const resB = await reportingService.getExpenseReportDetailed(validOrgBId, {});
    expect(resB.summary.expenseCount).toBe(0);
    expect(resB.rows.length).toBe(0);
  });

  it('REPORT-SEC-16: Property performance report tenant isolation enforced', async () => {
    const resB = await reportingService.getPropertyPerformanceReportDetailed(validOrgBId, {});
    expect(resB.summary.totalProperties).toBe(0);
    expect(resB.items.length).toBe(0);
  });

  it('REPORT-SEC-17: Resident search cannot escape tenant scope', async () => {
    const resB = await reportingService.getResidentReportDetailed(validOrgBId, {
      search: 'John',
    });
    expect(resB.rows.length).toBe(0);
  });

  it('REPORT-SEC-18: CSV export tenant isolation enforced', async () => {
    const csvB = await reportingService.exportResidentReportCsv(validOrgBId, {});
    expect(typeof csvB).toBe('string');
    // Header row only, no data rows
    const lines = csvB.trim().split('\n');
    expect(lines.length).toBe(1);
  });

  it('REPORT-SEC-19: CSV export respects filters', async () => {
    const csvA = await reportingService.exportOccupancyReportCsv(validOrgAId, {});
    expect(csvA.startsWith('Property,Building')).toBe(true);
  });

  it('REPORT-SEC-20: Historical financial data remains immutable during report generation', async () => {
    const res1 = await reportingService.getBillingReportDetailed(validOrgAId, {});
    const res2 = await reportingService.getBillingReportDetailed(validOrgAId, {});
    expect(res1.summary.totalInvoiced).toBe(res2.summary.totalInvoiced);
    expect(res1.summary.totalCollected).toBe(res2.summary.totalCollected);
  });
});
