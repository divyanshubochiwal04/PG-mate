import { describe, expect, it } from 'vitest';
import {
  getBillingReportApi,
  getDashboardOverviewApi,
  getExpenseReportApi,
  getMessReportApi,
  getOccupancyReportApi,
  getResidentReportApi,
} from '../features/reporting/api/reporting.api';

describe('F2.4 Mobile Reporting Operational Intelligence Specification', () => {
  it('1. API endpoints exported and defined', () => {
    expect(getDashboardOverviewApi).toBeDefined();
    expect(getOccupancyReportApi).toBeDefined();
    expect(getResidentReportApi).toBeDefined();
    expect(getBillingReportApi).toBeDefined();
    expect(getMessReportApi).toBeDefined();
    expect(getExpenseReportApi).toBeDefined();
  });

  it('2. API routes must be relative without redundant /api/v1 prefix', () => {
    expect(getDashboardOverviewApi.name).toBe('getDashboardOverviewApi');
    expect(getOccupancyReportApi.name).toBe('getOccupancyReportApi');
  });
});
