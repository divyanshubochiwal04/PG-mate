import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBedAllocationRepository,
  KyselyBedRepository,
  KyselyBuildingRepository,
  KyselyFloorRepository,
  KyselyPropertyRepository,
  KyselyResidentRepository,
  KyselyRoomRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type {
  BedAllocationRow,
  BedRow,
  BuildingRow,
  FloorRow,
  PropertyRow,
  ResidentRow,
  RoomRow,
  StayRow,
} from '@m-square/database';
import { StayAllocationService } from '../modules/resident/services/stay-allocation.service';

const ORG = 'org-stay-alloc';
const RES_ID = 'res-1';
const BED_1 = 'bed-1';
const BED_2 = 'bed-2';
const STAY_1 = 'stay-1';
const ALLOC_1 = 'alloc-1';

function makeResident(overrides: Partial<ResidentRow> = {}): ResidentRow {
  return {
    id: RES_ID,
    organization_id: ORG,
    resident_code: 'RES-000001',
    first_name: 'John',
    middle_name: null,
    last_name: 'Doe',
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
    ...overrides,
  };
}

function makeBed(overrides: Partial<BedRow> = {}): BedRow {
  return {
    id: BED_1,
    room_id: 'room-1',
    organization_id: ORG,
    bed_number: 'B1',
    display_order: 1,
    status: 'AVAILABLE',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeRoom(overrides: Partial<RoomRow> = {}): RoomRow {
  return {
    id: 'room-1',
    floor_id: 'floor-1',
    building_id: 'bldg-1',
    property_id: 'prop-1',
    organization_id: ORG,
    room_number: '101',
    room_type: 'SINGLE',
    capacity: 1,
    display_order: 1,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeFloor(): FloorRow {
  return {
    id: 'floor-1',
    building_id: 'bldg-1',
    organization_id: ORG,
    name: 'Floor 1',
    floor_number: 1,
    display_order: 1,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeBuilding(): BuildingRow {
  return {
    id: 'bldg-1',
    property_id: 'prop-1',
    organization_id: ORG,
    name: 'Block A',
    code: 'BLK-A',
    display_order: 1,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeProperty(): PropertyRow {
  return {
    id: 'prop-1',
    organization_id: ORG,
    name: 'Main PG',
    code: 'PG-01',
    address_line1: 'Road 1',
    address_line2: null,
    locality: 'Loc',
    city: 'City',
    state: 'State',
    postal_code: '123456',
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeStay(overrides: Partial<StayRow> = {}): StayRow {
  return {
    id: STAY_1,
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

function makeAllocation(overrides: Partial<BedAllocationRow> = {}): BedAllocationRow {
  return {
    id: ALLOC_1,
    organization_id: ORG,
    stay_id: STAY_1,
    bed_id: BED_1,
    start_at: new Date(),
    end_at: null,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('apps/api — M6 Stay & Bed Allocation Workflows', () => {
  let service: StayAllocationService;

  beforeEach(() => {
    service = new StayAllocationService();
    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn) => fn({} as any)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Check-In Workflow', () => {
    it('SA1 — successful atomic Check-In (creates Stay + BedAllocation)', async () => {
      vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeResident()
      );
      vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(null);
      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValue(makeBed());
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeRoom()
      );
      vi.spyOn(KyselyFloorRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeFloor()
      );
      vi.spyOn(KyselyBuildingRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeBuilding()
      );
      vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeProperty()
      );
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByBed').mockResolvedValue(null);
      vi.spyOn(KyselyStayRepository.prototype, 'createForOrganization').mockResolvedValue(
        makeStay()
      );
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'createForOrganization').mockResolvedValue(
        makeAllocation()
      );

      const result = await service.checkIn(ORG, { residentId: RES_ID, bedId: BED_1 });

      expect(result.stay.id).toBe(STAY_1);
      expect(result.allocation.bedId).toBe(BED_1);
      expect(result.allocation.status).toBe('ACTIVE');
    });

    it('SA2 — rejects Check-In if resident is INACTIVE', async () => {
      vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeResident({ status: 'INACTIVE' })
      );

      await expect(service.checkIn(ORG, { residentId: RES_ID, bedId: BED_1 })).rejects.toThrow(
        BadRequestException
      );
    });

    it('SA3 — rejects Check-In if resident already has an ACTIVE stay (409 Conflict)', async () => {
      vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeResident()
      );
      vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
        makeStay()
      );

      await expect(service.checkIn(ORG, { residentId: RES_ID, bedId: BED_1 })).rejects.toThrow(
        ConflictException
      );
    });

    it('SA4 — rejects Check-In if bed is MAINTENANCE or occupied (409 Conflict)', async () => {
      vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeResident()
      );
      vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(null);
      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeBed({ status: 'MAINTENANCE' })
      );

      await expect(service.checkIn(ORG, { residentId: RES_ID, bedId: BED_1 })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('Transfer Workflow', () => {
    it('SA5 — successful bed Transfer (ends current allocation, creates new allocation)', async () => {
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeAllocation()
      );
      vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeStay()
      );
      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockImplementation(
        async (id) => {
          if (id === BED_1) return makeBed({ id: BED_1 });
          if (id === BED_2) return makeBed({ id: BED_2, bed_number: 'B2' });
          return null;
        }
      );
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByBed').mockResolvedValue(null);
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation').mockResolvedValue(
        makeAllocation({ status: 'ENDED', end_at: new Date() })
      );
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'createForOrganization').mockResolvedValue(
        makeAllocation({ id: 'alloc-2', bed_id: BED_2 })
      );

      const result = await service.transfer(ORG, ALLOC_1, { targetBedId: BED_2 });

      expect(result.bedId).toBe(BED_2);
      expect(result.status).toBe('ACTIVE');
    });

    it('SA8 [P2-1] — locks stay row FOR UPDATE during transfer to maintain lock ordering', async () => {
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeAllocation()
      );
      const stayLockSpy = vi
        .spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate')
        .mockResolvedValue(makeStay());
      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockImplementation(
        async (id) => {
          if (id === BED_1) return makeBed({ id: BED_1 });
          if (id === BED_2) return makeBed({ id: BED_2, bed_number: 'B2' });
          return null;
        }
      );
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByBed').mockResolvedValue(null);
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation').mockResolvedValue(
        makeAllocation({ status: 'ENDED' })
      );
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'createForOrganization').mockResolvedValue(
        makeAllocation({ id: 'alloc-2', bed_id: BED_2 })
      );

      await service.transfer(ORG, ALLOC_1, { targetBedId: BED_2 });

      expect(stayLockSpy).toHaveBeenCalledWith(STAY_1, ORG, expect.anything());
    });
  });

  describe('Checkout Workflow', () => {
    it('SA6 — successful Checkout (completes stay & ends active allocation)', async () => {
      vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeStay()
      );
      vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValue(
        makeAllocation()
      );
      const endAllocSpy = vi
        .spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation')
        .mockResolvedValue(makeAllocation({ status: 'ENDED' }));
      vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValue(
        makeStay({ status: 'COMPLETED', actual_checkout_date: new Date() })
      );

      const result = await service.checkOut(ORG, STAY_1, {});

      expect(endAllocSpy).toHaveBeenCalledWith(ALLOC_1, ORG, expect.anything(), expect.anything());
      expect(result.status).toBe('COMPLETED');
    });

    it('SA7 — rejects Checkout if stay is already COMPLETED', async () => {
      vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeStay({ status: 'COMPLETED' })
      );

      await expect(service.checkOut(ORG, STAY_1, {})).rejects.toThrow(BadRequestException);
    });
  });
});
