import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyCommercialRepository,
  KyselyFacilityRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type {
  FacilityRow,
  ResidentCommercialAgreementRow,
  ResidentRow,
  StayRow,
} from '@m-square/database';
import { CommercialService } from '../modules/commercial/commercial.service';

const ORG = '123e4567-e89b-12d3-a456-426614174000';
const RES_ID = '123e4567-e89b-12d3-a456-426614174001';
const STAY_ID = '123e4567-e89b-12d3-a456-426614174002';
const FAC_ID = '123e4567-e89b-12d3-a456-426614174003';
const INVALID_FAC_ID = '123e4567-e89b-12d3-a456-426614174099';

function makeResident(): ResidentRow {
  return {
    id: RES_ID,
    organization_id: ORG,
    resident_code: 'RES-100001',
    first_name: 'Rahul',
    middle_name: null,
    last_name: 'Sharma',
    preferred_name: null,
    date_of_birth: null,
    gender: 'MALE',
    phone: '+919876543210',
    alternate_phone: null,
    email: null,
    address_line1: null,
    city: null,
    state: null,
    postal_code: null,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeStay(): StayRow {
  return {
    id: STAY_ID,
    organization_id: ORG,
    resident_id: RES_ID,
    admission_date: new Date(),
    expected_checkout_date: null,
    actual_checkout_date: null,
    status: 'ACTIVE',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeAgreement(
  overrides: Partial<ResidentCommercialAgreementRow> = {}
): ResidentCommercialAgreementRow {
  return {
    id: '123e4567-e89b-12d3-a456-426614174010',
    organization_id: ORG,
    resident_id: RES_ID,
    stay_id: STAY_ID,
    base_rent_amount: 8000.0,
    security_deposit_amount: 8000.0,
    security_deposit_status: 'PENDING',
    billing_cycle: 'JOINING_DATE',
    effective_date: '2026-08-01',
    end_date: null,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('CommercialService Unit Tests', () => {
  let service: CommercialService;
  let commercialRepo: KyselyCommercialRepository;
  let residentRepo: KyselyResidentRepository;
  let stayRepo: KyselyStayRepository;
  let facilityRepo: KyselyFacilityRepository;
  let unitOfWork: KyselyUnitOfWork;

  beforeEach(() => {
    const dummyDb = {} as unknown;
    commercialRepo = new KyselyCommercialRepository(dummyDb as never);
    residentRepo = new KyselyResidentRepository(dummyDb as never);
    stayRepo = new KyselyStayRepository(dummyDb as never);
    facilityRepo = new KyselyFacilityRepository(dummyDb as never);
    unitOfWork = new KyselyUnitOfWork(dummyDb as never);

    vi.spyOn(unitOfWork, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (work: any) => work({} as any)
    );

    service = new CommercialService();
    (service as unknown as Record<string, unknown>)['commercialRepo'] = commercialRepo;
    (service as unknown as Record<string, unknown>)['residentRepo'] = residentRepo;
    (service as unknown as Record<string, unknown>)['stayRepo'] = stayRepo;
    (service as unknown as Record<string, unknown>)['facilityRepo'] = facilityRepo;
    (service as unknown as Record<string, unknown>)['unitOfWork'] = unitOfWork;
  });

  it('1. should calculate commercial summary with rent, facilities, and additional charges', async () => {
    vi.spyOn(residentRepo, 'findByIdForOrganization').mockResolvedValue(makeResident());
    vi.spyOn(stayRepo, 'findActiveByResident').mockResolvedValue(makeStay());
    vi.spyOn(commercialRepo, 'findActiveAgreement').mockResolvedValue(makeAgreement());
    vi.spyOn(commercialRepo, 'findActiveFacilities').mockResolvedValue([
      {
        id: '123e4567-e89b-12d3-a456-426614174020',
        organization_id: ORG,
        resident_id: RES_ID,
        stay_id: STAY_ID,
        facility_id: FAC_ID,
        facility_type: 'PAID',
        monthly_charge: 500,
        status: 'ACTIVE',
        effective_date: '2026-08-01',
        created_at: new Date(),
        updated_at: new Date(),
        facilityName: 'High Speed Wi-Fi',
        facilityCode: 'WIFI-01',
      },
    ]);
    vi.spyOn(commercialRepo, 'findActiveCharges').mockResolvedValue([
      {
        id: '123e4567-e89b-12d3-a456-426614174030',
        organization_id: ORG,
        resident_id: RES_ID,
        stay_id: STAY_ID,
        agreement_id: '123e4567-e89b-12d3-a456-426614174010',
        charge_type: 'PARKING',
        description: 'Car Parking',
        amount: 300,
        is_recurring: true,
        effective_date: '2026-08-01',
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    const res = await service.getCommercialSummary(ORG, RES_ID);

    expect(res.agreement?.baseRentAmount).toBe(8000);
    expect(res.facilities).toHaveLength(1);
    expect(res.additionalCharges).toHaveLength(1);
    expect(res.totalMonthlyAmount).toBe(8800); // 8000 + 500 + 300
  });

  it('2. should enforce cross-tenant access security (404 on invalid tenant context)', async () => {
    vi.spyOn(residentRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(service.getCommercialSummary(ORG, RES_ID)).rejects.toThrow(NotFoundException);
  });

  it('3. should perform pricing revision by superseding old agreement and creating new revision', async () => {
    vi.spyOn(residentRepo, 'findByIdForOrganization').mockResolvedValue(makeResident());
    vi.spyOn(stayRepo, 'findActiveByResident').mockResolvedValue(makeStay());
    const supersedeSpy = vi
      .spyOn(commercialRepo, 'supersedeActiveAgreement')
      .mockResolvedValue(undefined);
    const createSpy = vi.spyOn(commercialRepo, 'createAgreement').mockResolvedValue(
      makeAgreement({
        id: '123e4567-e89b-12d3-a456-426614174011',
        base_rent_amount: 9000,
        effective_date: '2026-09-01',
      })
    );

    const updated = await service.createAgreementRevision(ORG, RES_ID, {
      baseRentAmount: 9000,
      effectiveDate: '2026-09-01',
    });

    expect(supersedeSpy).toHaveBeenCalledWith(ORG, STAY_ID, '2026-09-01', expect.anything());
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        base_rent_amount: 9000,
        effective_date: '2026-09-01',
      }),
      expect.anything()
    );
    expect(updated.baseRentAmount).toBe(9000);
  });

  it('4. should reject facility assignment if catalog facility is not found in organization', async () => {
    vi.spyOn(residentRepo, 'findByIdForOrganization').mockResolvedValue(makeResident());
    vi.spyOn(stayRepo, 'findActiveByResident').mockResolvedValue(makeStay());
    vi.spyOn(facilityRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(
      service.assignResidentFacility(ORG, RES_ID, { facilityId: INVALID_FAC_ID })
    ).rejects.toThrow(NotFoundException);
  });

  it('5. should assign catalog facility to resident when facility is valid', async () => {
    vi.spyOn(residentRepo, 'findByIdForOrganization').mockResolvedValue(makeResident());
    vi.spyOn(stayRepo, 'findActiveByResident').mockResolvedValue(makeStay());
    vi.spyOn(facilityRepo, 'findByIdForOrganization').mockResolvedValue({
      id: FAC_ID,
      organization_id: ORG,
      code: 'WIFI',
      name: 'Wi-Fi',
      description: null,
      category: 'UTILITY',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    } as FacilityRow);
    vi.spyOn(commercialRepo, 'findActiveFacilities').mockResolvedValue([]);
    vi.spyOn(commercialRepo, 'assignFacility').mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174021',
      organization_id: ORG,
      resident_id: RES_ID,
      stay_id: STAY_ID,
      facility_id: FAC_ID,
      facility_type: 'INCLUDED',
      monthly_charge: 0,
      status: 'ACTIVE',
      effective_date: '2026-08-01',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await service.assignResidentFacility(ORG, RES_ID, { facilityId: FAC_ID });

    expect(res.facilityName).toBe('Wi-Fi');
    expect(res.status).toBe('ACTIVE');
  });
});
