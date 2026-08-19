import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBedAllocationRepository,
  KyselyBedRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import { StayAllocationService } from '../modules/resident/services/stay-allocation.service';

const ORG_A = '123e4567-e89b-12d3-a456-426614174001';
const ORG_B = '123e4567-e89b-12d3-a456-426614174002';
const ALLOC_1 = '123e4567-e89b-12d3-a456-426614174003';
const STAY_1 = '123e4567-e89b-12d3-a456-426614174004';
const BED_1 = '123e4567-e89b-12d3-a456-426614174005';
const BED_2 = '123e4567-e89b-12d3-a456-426614174006';

describe('apps/api — M13B Resident Transfer Tenant Security & Rules Unit Suite', () => {
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

  it('TR1 — Successful transfer of resident by Organization A', async () => {
    const mockAlloc = {
      id: ALLOC_1,
      stay_id: STAY_1,
      bed_id: BED_1,
      organization_id: ORG_A,
      status: 'ACTIVE',
      start_at: new Date(),
      end_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockStay = {
      id: STAY_1,
      resident_id: 'res-1',
      organization_id: ORG_A,
      status: 'ACTIVE',
      admission_date: new Date(),
      actual_checkout_date: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockBed1 = {
      id: BED_1,
      room_id: 'room-1',
      bed_number: 'B1',
      status: 'OCCUPIED',
      organization_id: ORG_A,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const mockBed2 = {
      id: BED_2,
      room_id: 'room-2',
      bed_number: 'B2',
      status: 'AVAILABLE',
      organization_id: ORG_A,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockAlloc as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockStay as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockImplementation(async (id) => {
      if (id === BED_1) return mockBed1 as any;
      if (id === BED_2) return mockBed2 as any;
      return null;
    });
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByBed').mockResolvedValue(null);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation').mockResolvedValue({} as any);
    vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValue({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'createForOrganization').mockResolvedValue({
      ...mockAlloc,
      id: 'alloc-new',
      bed_id: BED_2,
    } as any);

    const result = await stayAllocationService.transfer(ORG_A, ALLOC_1, { targetBedId: BED_2 });

    expect(result.bedId).toBe(BED_2);
    expect(result.status).toBe('ACTIVE');
  });

  it('TR2 — Cross-tenant transfer attempt by Org B on Org A allocation is rejected with 404', async () => {
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findByIdForUpdate').mockResolvedValue(null);

    await expect(
      stayAllocationService.transfer(ORG_B, ALLOC_1, { targetBedId: BED_2 })
    ).rejects.toThrow(NotFoundException);
  });

  it('TR3 — Transfer to target bed belonging to Org B is rejected with 404', async () => {
    const mockAlloc = {
      id: ALLOC_1,
      stay_id: STAY_1,
      bed_id: BED_1,
      organization_id: ORG_A,
      status: 'ACTIVE',
    };
    const mockStay = { id: STAY_1, status: 'ACTIVE' };
    const mockBed1 = { id: BED_1, status: 'OCCUPIED' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockAlloc as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockStay as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockImplementation(async (id) => {
      if (id === BED_1) return mockBed1 as any;
      return null; // BED_2 not found for Org A
    });

    await expect(
      stayAllocationService.transfer(ORG_A, ALLOC_1, { targetBedId: BED_2 })
    ).rejects.toThrow(NotFoundException);
  });

  it('TR4 — Transfer to occupied target bed is rejected with ConflictException', async () => {
    const mockAlloc = { id: ALLOC_1, stay_id: STAY_1, bed_id: BED_1, status: 'ACTIVE' };
    const mockStay = { id: STAY_1, status: 'ACTIVE' };
    const mockBed1 = { id: BED_1, status: 'OCCUPIED' };
    const mockBed2 = { id: BED_2, status: 'OCCUPIED' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockAlloc as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockStay as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockImplementation(async (id) => {
      if (id === BED_1) return mockBed1 as any;
      if (id === BED_2) return mockBed2 as any;
      return null;
    });

    await expect(
      stayAllocationService.transfer(ORG_A, ALLOC_1, { targetBedId: BED_2 })
    ).rejects.toThrow(ConflictException);
  });

  it('TR5 — Transfer to maintenance target bed is rejected with BadRequestException', async () => {
    const mockAlloc = { id: ALLOC_1, stay_id: STAY_1, bed_id: BED_1, status: 'ACTIVE' };
    const mockStay = { id: STAY_1, status: 'ACTIVE' };
    const mockBed1 = { id: BED_1, status: 'OCCUPIED' };
    const mockBed2 = { id: BED_2, status: 'MAINTENANCE' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockAlloc as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockStay as any
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockImplementation(async (id) => {
      if (id === BED_1) return mockBed1 as any;
      if (id === BED_2) return mockBed2 as any;
      return null;
    });

    await expect(
      stayAllocationService.transfer(ORG_A, ALLOC_1, { targetBedId: BED_2 })
    ).rejects.toThrow(BadRequestException);
  });

  it('TR6 — Transfer to same/current bed is rejected with BadRequestException', async () => {
    const mockAlloc = { id: ALLOC_1, stay_id: STAY_1, bed_id: BED_1, status: 'ACTIVE' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      mockAlloc as any
    );

    await expect(
      stayAllocationService.transfer(ORG_A, ALLOC_1, { targetBedId: BED_1 })
    ).rejects.toThrow(BadRequestException);
  });
});
