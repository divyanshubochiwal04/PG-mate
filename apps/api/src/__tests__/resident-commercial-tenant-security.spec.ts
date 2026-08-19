import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyCommercialRepository,
  KyselyFacilityRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import { CommercialService } from '../modules/commercial/commercial.service';

const ORG_A = '123e4567-e89b-12d3-a456-426614174001';
const ORG_B = '123e4567-e89b-12d3-a456-426614174002';
const RES_A = '123e4567-e89b-12d3-a456-426614174003';
const STAY_A = '123e4567-e89b-12d3-a456-426614174004';
const FAC_1 = '123e4567-e89b-12d3-a456-426614174005';

describe('apps/api — M13C Resident Commercial Management Tenant Security Unit Suite', () => {
  let commercialService: CommercialService;

  beforeEach(() => {
    commercialService = new CommercialService();

    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(async (cb) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return cb({} as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('COM1 — Tenant A can view own resident commercial summary', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };
    const mockStay = { id: STAY_A, resident_id: RES_A, organization_id: ORG_A, status: 'ACTIVE' };
    const mockAgreement = {
      id: 'ag-1',
      organization_id: ORG_A,
      resident_id: RES_A,
      stay_id: STAY_A,
      base_rent_amount: '8000.00',
      security_deposit_amount: '10000.00',
      security_deposit_status: 'PAID',
      billing_cycle: 'JOINING_DATE',
      effective_date: '2026-08-01',
      end_date: null,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      mockStay as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyCommercialRepository.prototype, 'findActiveAgreement').mockResolvedValue(
      mockAgreement as any
    );
    vi.spyOn(KyselyCommercialRepository.prototype, 'findActiveFacilities').mockResolvedValue([]);
    vi.spyOn(KyselyCommercialRepository.prototype, 'findActiveCharges').mockResolvedValue([]);

    const summary = await commercialService.getCommercialSummary(ORG_A, RES_A);

    expect(summary.agreement?.baseRentAmount).toBe(8000);
    expect(summary.totalMonthlyAmount).toBe(8000);
  });

  it('COM2 — Tenant B attempting to read Tenant A commercial summary returns 404', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(commercialService.getCommercialSummary(ORG_B, RES_A)).rejects.toThrow(
      NotFoundException
    );
  });

  it('COM3 — Cross-tenant facility assignment by Org B is rejected with 404', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };
    const mockStay = { id: STAY_A, resident_id: RES_A, organization_id: ORG_A, status: 'ACTIVE' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      mockStay as any
    );
    vi.spyOn(KyselyFacilityRepository.prototype, 'findByIdForOrganization').mockResolvedValue(null); // Facility not found for Org B

    await expect(
      commercialService.assignResidentFacility(ORG_B, RES_A, { facilityId: FAC_1 })
    ).rejects.toThrow(NotFoundException);
  });

  it('COM4 — Duplicate active facility assignment is rejected with ConflictException (409)', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };
    const mockStay = { id: STAY_A, resident_id: RES_A, organization_id: ORG_A, status: 'ACTIVE' };
    const mockCatalogFac = { id: FAC_1, organization_id: ORG_A, name: 'AC', code: 'AC' };
    const mockActiveFacs = [
      {
        id: 'rf-1',
        organization_id: ORG_A,
        resident_id: RES_A,
        stay_id: STAY_A,
        facility_id: FAC_1,
        facility_type: 'PAID',
        monthly_charge: '1500.00',
        status: 'ACTIVE',
        effective_date: '2026-08-01',
        created_at: new Date(),
        updated_at: new Date(),
        facilityName: 'AC',
        facilityCode: 'AC',
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      mockStay as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyFacilityRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockCatalogFac as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyCommercialRepository.prototype, 'findActiveFacilities').mockResolvedValue(
      mockActiveFacs as any
    );

    await expect(
      commercialService.assignResidentFacility(ORG_A, RES_A, { facilityId: FAC_1 })
    ).rejects.toThrow(ConflictException);
  });

  it('COM5 — Commercial modification attempt on resident without active stay returns 400', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(null);

    await expect(
      commercialService.createAgreementRevision(ORG_A, RES_A, { baseRentAmount: 9000 })
    ).rejects.toThrow(BadRequestException);
  });
});
