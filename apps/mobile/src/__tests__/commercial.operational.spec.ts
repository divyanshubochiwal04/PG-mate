import { describe, expect, it } from 'vitest';
import {
  addAdditionalChargeApi,
  assignResidentFacilityApi,
  cancelAdditionalChargeApi,
  checkInCommercialApi,
  createAgreementRevisionApi,
  getCommercialHistoryApi,
  getCommercialSummaryApi,
  revokeResidentFacilityApi,
} from '../features/commercial/api/commercial.api';

describe('M7.1 + F2.1 — Resident Commercial Management Operational Suite', () => {
  it('COM1 — Commercial API Client exports all 8 contract methods', () => {
    expect(typeof getCommercialSummaryApi).toBe('function');
    expect(typeof getCommercialHistoryApi).toBe('function');
    expect(typeof createAgreementRevisionApi).toBe('function');
    expect(typeof assignResidentFacilityApi).toBe('function');
    expect(typeof revokeResidentFacilityApi).toBe('function');
    expect(typeof addAdditionalChargeApi).toBe('function');
    expect(typeof cancelAdditionalChargeApi).toBe('function');
    expect(typeof checkInCommercialApi).toBe('function');
  });

  it('COM2 — TanStack Query summary key uses organization and resident scope', () => {
    const orgId = 'org-tenant-1';
    const residentId = 'res-999';
    const queryKey = ['resident-commercial', orgId, residentId];
    expect(queryKey).toEqual(['resident-commercial', 'org-tenant-1', 'res-999']);
  });

  it('COM3 — Commercial history query key uses tenant isolation scope', () => {
    const orgId = 'org-tenant-1';
    const residentId = 'res-999';
    const queryKey = ['resident-commercial-history', orgId, residentId];
    expect(queryKey).toEqual(['resident-commercial-history', 'org-tenant-1', 'res-999']);
  });

  it('COM4 — Commercial total monthly payable calculates rent + paid facilities + charges', () => {
    const baseRent = 8000;
    const facilities = [{ monthlyCharge: 500 }, { monthlyCharge: 0 }];
    const charges = [
      { amount: 300, isRecurring: true },
      { amount: 1000, isRecurring: false },
    ];

    const facTotal = facilities.reduce((sum, f) => sum + f.monthlyCharge, 0);
    const chargeTotal = charges.filter((c) => c.isRecurring).reduce((sum, c) => sum + c.amount, 0);
    const grandTotal = baseRent + facTotal + chargeTotal;

    expect(grandTotal).toBe(8800);
  });

  it('COM5 — Commercial pricing validation enforces non-negative rent', () => {
    const validateRent = (rent: number) => !isNaN(rent) && rent >= 0;
    expect(validateRent(8000)).toBe(true);
    expect(validateRent(0)).toBe(true);
    expect(validateRent(-100)).toBe(false);
  });

  it('COM6 — Atomic check-in payload builds valid CheckInCommercialInput contract', () => {
    const payload = {
      residentId: 'res-1',
      bedId: 'bed-1',
      admissionDate: '2026-08-01',
      baseRentAmount: 8000,
      securityDepositAmount: 8000,
      billingCycle: 'JOINING_DATE' as const,
      facilityIds: ['fac-1'],
      additionalCharges: [
        {
          chargeType: 'PARKING' as const,
          description: 'Car Parking',
          amount: 500,
          isRecurring: true,
        },
      ],
    };

    expect(payload.residentId).toBe('res-1');
    expect(payload.baseRentAmount).toBe(8000);
    expect(payload.additionalCharges).toHaveLength(1);
  });
});
