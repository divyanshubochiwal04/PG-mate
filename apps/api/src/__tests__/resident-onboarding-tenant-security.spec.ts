import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBedRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import { StayAllocationService } from '../modules/resident/services/stay-allocation.service';

const ORG_A = '123e4567-e89b-12d3-a456-426614174001';
const ORG_B = '123e4567-e89b-12d3-a456-426614174002';
const RES_A = '123e4567-e89b-12d3-a456-426614174003';
const RES_B = '123e4567-e89b-12d3-a456-426614174004';
const BED_A = '123e4567-e89b-12d3-a456-426614174005';
const BED_B = '123e4567-e89b-12d3-a456-426614174006';

describe('apps/api — M12 Resident Onboarding & Tenant Security Unit Suite', () => {
  let stayAllocationService: StayAllocationService;

  beforeEach(() => {
    stayAllocationService = new StayAllocationService();
    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(async (cb) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return cb({} as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ISO-ONB-1 — Check-in rejects when resident belongs to Org B', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(
      stayAllocationService.checkIn(ORG_A, {
        residentId: RES_B,
        bedId: BED_A,
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('ISO-ONB-2 — Check-in rejects when bed belongs to Org B', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: RES_A,
      organizationId: ORG_A,
      status: 'ACTIVE',
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue({
      id: RES_A,
      organizationId: ORG_A,
      status: 'ACTIVE',
    } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForOrganization').mockResolvedValue(null);
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValue(null);

    await expect(
      stayAllocationService.checkIn(ORG_A, {
        residentId: RES_A,
        bedId: BED_B,
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('ISO-ONB-3 — Check-in rejects when resident already has an active stay', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: RES_A,
      organizationId: ORG_A,
      status: 'ACTIVE',
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue({
      id: RES_A,
      organizationId: ORG_A,
      status: 'ACTIVE',
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: BED_A,
      status: 'AVAILABLE',
      organizationId: ORG_A,
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValue({
      id: BED_A,
      status: 'AVAILABLE',
      organizationId: ORG_A,
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174007',
    } as any);

    await expect(
      stayAllocationService.checkIn(ORG_A, {
        residentId: RES_A,
        bedId: BED_A,
      })
    ).rejects.toThrow(ConflictException);
  });

  it('ISO-ONB-4 — Check-in rejects when target bed is in MAINTENANCE status', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: RES_A,
      organizationId: ORG_A,
      status: 'ACTIVE',
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue({
      id: RES_A,
      organizationId: ORG_A,
      status: 'ACTIVE',
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: BED_A,
      status: 'MAINTENANCE',
      organizationId: ORG_A,
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValue({
      id: BED_A,
      status: 'MAINTENANCE',
      organizationId: ORG_A,
    } as any);
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(null);

    await expect(
      stayAllocationService.checkIn(ORG_A, {
        residentId: RES_A,
        bedId: BED_A,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('ISO-ONB-5 — Check-in rejects when target bed is already occupied', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: RES_A,
      organizationId: ORG_A,
      status: 'ACTIVE',
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue({
      id: RES_A,
      organizationId: ORG_A,
      status: 'ACTIVE',
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: BED_A,
      status: 'OCCUPIED',
      organizationId: ORG_A,
    } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValue({
      id: BED_A,
      status: 'OCCUPIED',
      organizationId: ORG_A,
    } as any);
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(null);

    await expect(
      stayAllocationService.checkIn(ORG_A, {
        residentId: RES_A,
        bedId: BED_A,
      })
    ).rejects.toThrow(BadRequestException);
  });
});
