import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBedAllocationRepository,
  KyselyEmergencyContactRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import { ResidentService } from '../modules/resident/services/resident.service';

const ORG_A = '123e4567-e89b-12d3-a456-426614174001';
const ORG_B = '123e4567-e89b-12d3-a456-426614174002';
const RES_A = '123e4567-e89b-12d3-a456-426614174003';

describe('apps/api — M13A Resident Profile & Tenant Security Unit Suite', () => {
  let residentService: ResidentService;

  beforeEach(() => {
    residentService = new ResidentService();

    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(async (cb) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return cb({} as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PRO-1 — Successful update of resident profile and emergency contact', async () => {
    const mockResidentRow = {
      id: RES_A,
      organization_id: ORG_A,
      resident_code: 'RES-000001',
      first_name: 'Rahul',
      last_name: 'Sharma',
      gender: 'MALE',
      phone: '+919876543210',
      email: 'rahul@example.com',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockResidentRow as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'updateForOrganization').mockResolvedValue({
      ...mockResidentRow,
      first_name: 'Vikram',
      last_name: 'Singhania',
      phone: '+919999988888',
      email: 'vikram@example.com',
    } as any);
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findPrimaryByResident').mockResolvedValue(
      {
        id: 'contact-1',
        resident_id: RES_A,
        organization_id: ORG_A,
        name: 'Rajesh Singhania',
        relationship: 'PARENT',
        phone: '+919999977777',
        is_primary: true,
        created_at: new Date(),
        updated_at: new Date(),
        alternate_phone: null,
      }
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'updateForResident').mockResolvedValue(
      {} as any
    );
    vi.spyOn(
      KyselyBedAllocationRepository.prototype,
      'findCurrentLocationForResident'
    ).mockResolvedValue(null);

    const updated = await residentService.updateResident(RES_A, ORG_A, {
      firstName: 'Vikram',
      lastName: 'Singhania',
      phone: '+919999988888',
      email: 'vikram@example.com',
      emergencyContact: {
        name: 'Rajesh Singhania',
        relationship: 'PARENT',
        phone: '+919999977777',
      },
    });

    expect(updated.firstName).toBe('Vikram');
    expect(updated.lastName).toBe('Singhania');
    expect(updated.phone).toBe('+919999988888');
    expect(updated.email).toBe('vikram@example.com');
    expect(updated.primaryEmergencyContact?.name).toBe('Rajesh Singhania');
  });

  it('PRO-2 — Cross-tenant update attempt is rejected with 404', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(null);

    await expect(
      residentService.updateResident(RES_A, ORG_B, {
        firstName: 'Hacker',
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('PRO-3 — Setting status INACTIVE when resident has active stay is rejected', async () => {
    const mockResidentRow = {
      id: RES_A,
      organization_id: ORG_A,
      status: 'ACTIVE',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockResidentRow as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue({
      id: 'stay-1',
    } as any);

    await expect(
      residentService.updateResident(RES_A, ORG_A, {
        status: 'INACTIVE',
      })
    ).rejects.toThrow(BadRequestException);
  });
});
