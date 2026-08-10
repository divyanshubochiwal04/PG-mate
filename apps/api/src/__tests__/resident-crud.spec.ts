import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBedAllocationRepository,
  KyselyEmergencyContactRepository,
  KyselyOrganizationCounterRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { ResidentRow, StayRow } from '@m-square/database';
import { ResidentService } from '../modules/resident/services/resident.service';

const ORG = 'org-res-crud';
const RES_ID = 'res-1';

function makeResident(overrides: Partial<ResidentRow> = {}): ResidentRow {
  return {
    id: RES_ID,
    organization_id: ORG,
    resident_code: 'RES-000001',
    first_name: 'John',
    middle_name: null,
    last_name: 'Doe',
    preferred_name: null,
    date_of_birth: new Date('2000-01-15'),
    gender: 'MALE',
    phone: '+919876543210',
    alternate_phone: null,
    email: 'john.doe@example.com',
    address_line1: '123 Main St',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560103',
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeStay(overrides: Partial<StayRow> = {}): StayRow {
  return {
    id: 'stay-1',
    organization_id: ORG,
    resident_id: RES_ID,
    admission_date: new Date(),
    expected_checkout_date: null,
    actual_checkout_date: null,
    status: 'ACTIVE',
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('apps/api — M6 Resident CRUD & Search Suite', () => {
  let service: ResidentService;

  beforeEach(() => {
    service = new ResidentService();
    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn) => fn({} as any)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('R1 — creates a new resident with auto-generated resident_code', async () => {
    vi.spyOn(KyselyOrganizationCounterRepository.prototype, 'getNextValueForUpdate').mockResolvedValue(1);
    vi.spyOn(KyselyResidentRepository.prototype, 'createForOrganization').mockResolvedValue(
      makeResident()
    );

    const result = await service.createResident(ORG, {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'MALE',
      phone: '+919876543210',
    });

    expect(result.residentCode).toBe('RES-000001');
    expect(result.firstName).toBe('John');
  });

  it('R2 — retrieves resident by ID with primary contact and current location', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      makeResident()
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findPrimaryByResident').mockResolvedValue(
      null
    );
    vi.spyOn(
      KyselyBedAllocationRepository.prototype,
      'findCurrentLocationForResident'
    ).mockResolvedValue(null);

    const result = await service.getResidentById(RES_ID, ORG);
    expect(result.id).toBe(RES_ID);
    expect(result.status).toBe('ACTIVE');
  });

  it('R3 — throws NotFoundException when resident does not exist or wrong tenant', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      null
    );

    await expect(service.getResidentById('wrong-id', ORG)).rejects.toThrow(NotFoundException);
  });

  it('R4 — updates resident profile attributes', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      makeResident()
    );
    vi.spyOn(KyselyResidentRepository.prototype, 'updateForOrganization').mockResolvedValue(
      makeResident({ first_name: 'Johnny' })
    );

    const updated = await service.updateResident(RES_ID, ORG, { firstName: 'Johnny' });
    expect(updated.firstName).toBe('Johnny');
  });

  it('R5 — retrieves full resident stay and allocation history', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      makeResident()
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findPrimaryByResident').mockResolvedValue(
      null
    );
    vi.spyOn(
      KyselyBedAllocationRepository.prototype,
      'findCurrentLocationForResident'
    ).mockResolvedValue(null);
    vi.spyOn(KyselyStayRepository.prototype, 'findAllByResident').mockResolvedValue([]);

    const history = await service.getResidentHistory(RES_ID, ORG);
    expect(history.resident.id).toBe(RES_ID);
    expect(history.stays.length).toBe(0);
    expect(history.allocations.length).toBe(0);
  });

  it('R6 [P1-2] — rejects resident deactivation when active stay exists (400 BadRequest)', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      makeResident()
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      makeStay()
    );

    await expect(
      service.updateResident(RES_ID, ORG, { status: 'INACTIVE' })
    ).rejects.toThrow(BadRequestException);
  });

  it('R7 [P1-2] — permits resident deactivation after checkout (no active stay)', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      makeResident()
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(null);
    vi.spyOn(KyselyResidentRepository.prototype, 'updateForOrganization').mockResolvedValue(
      makeResident({ status: 'INACTIVE' })
    );

    const updated = await service.updateResident(RES_ID, ORG, { status: 'INACTIVE' });
    expect(updated.status).toBe('INACTIVE');
  });
});
