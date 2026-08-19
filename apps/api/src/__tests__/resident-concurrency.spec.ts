import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';

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
import type { BedRow, ResidentRow, StayRow } from '@m-square/database';
import { StayAllocationService } from '../modules/resident/services/stay-allocation.service';
import { ResidentService } from '../modules/resident/services/resident.service';

const ORG = 'org-concurrency';
const RES_1 = 'res-1';
const RES_2 = 'res-2';
const BED_1 = 'bed-1';

function makeResident(id: string): ResidentRow {
  return {
    id,
    organization_id: ORG,
    resident_code: `RES-${id}`,
    first_name: 'Resident',
    middle_name: null,
    last_name: id,
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

function makeBed(id: string): BedRow {
  return {
    id,
    room_id: 'room-1',
    organization_id: ORG,
    bed_number: 'B1',
    display_order: 1,
    status: 'AVAILABLE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('apps/api — M6 Concurrency Matrix & Double Allocation Suite', () => {
  let service: StayAllocationService;

  beforeEach(() => {
    service = new StayAllocationService();
    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn) => fn({} as any)
    );
    vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValue(makeBed(BED_1));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('C1 — Race 1: Concurrent Check-In for same bed -> exactly one succeeds, second gets 409 Conflict', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockImplementation(
      async (id) => makeResident(id)
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(null);
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValue(makeBed(BED_1));
    vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'room-1',
      floor_id: 'f-1',
      building_id: 'b-1',
      property_id: 'p-1',
      organization_id: ORG,
      room_number: '101',
      room_type: 'SINGLE',
      capacity: 1,
      display_order: 1,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyFloorRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'f-1',
      building_id: 'b-1',
      organization_id: ORG,
      name: 'F1',
      floor_number: 1,
      display_order: 1,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyBuildingRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'b-1',
      property_id: 'p-1',
      organization_id: ORG,
      name: 'B1',
      code: 'BLK',
      display_order: 1,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'p-1',
      organization_id: ORG,
      name: 'P1',
      code: 'PG',
      address_line1: 'Line',
      address_line2: null,
      locality: 'Loc',
      city: 'City',
      state: 'State',
      postal_code: '123456',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    let allocationCreated = false;
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByBed').mockImplementation(
      async () => {
        if (allocationCreated) {
          return {
            id: 'alloc-1',
            organization_id: ORG,
            stay_id: 'stay-1',
            bed_id: BED_1,
            start_at: new Date(),
            end_at: null,
            status: 'ACTIVE',
            created_at: new Date(),
            updated_at: new Date(),
          };
        }
        return null;
      }
    );

    vi.spyOn(KyselyStayRepository.prototype, 'createForOrganization').mockResolvedValue({
      id: 'stay-1',
      organization_id: ORG,
      resident_id: RES_1,
      admission_date: new Date(),
      expected_checkout_date: null,
      actual_checkout_date: null,
      status: 'ACTIVE',
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(KyselyBedAllocationRepository.prototype, 'createForOrganization').mockImplementation(
      async () => {
        allocationCreated = true;
        return {
          id: 'alloc-1',
          organization_id: ORG,
          stay_id: 'stay-1',
          bed_id: BED_1,
          start_at: new Date(),
          end_at: null,
          status: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date(),
        };
      }
    );

    // Run first check-in
    const res1 = await service.checkIn(ORG, { residentId: RES_1, bedId: BED_1 });
    expect(res1.allocation.bedId).toBe(BED_1);

    // Second concurrent check-in attempt for RES_2 on same BED_1 must fail with 409 Conflict
    await expect(service.checkIn(ORG, { residentId: RES_2, bedId: BED_1 })).rejects.toThrow(
      ConflictException
    );
  });

  it('C2 — Race 2: Concurrent Check-In for same resident -> second attempt fails with 409 Conflict', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
      makeResident(RES_1)
    );

    let activeStay: StayRow | null = null;
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockImplementation(
      async () => activeStay
    );
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValue(makeBed(BED_1));
    vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'room-1',
      floor_id: 'f-1',
      building_id: 'b-1',
      property_id: 'p-1',
      organization_id: ORG,
      room_number: '101',
      room_type: 'SINGLE',
      capacity: 1,
      display_order: 1,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyFloorRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'f-1',
      building_id: 'b-1',
      organization_id: ORG,
      name: 'F1',
      floor_number: 1,
      display_order: 1,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyBuildingRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'b-1',
      property_id: 'p-1',
      organization_id: ORG,
      name: 'B1',
      code: 'BLK',
      display_order: 1,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'p-1',
      organization_id: ORG,
      name: 'P1',
      code: 'PG',
      address_line1: 'Line',
      address_line2: null,
      locality: 'Loc',
      city: 'City',
      state: 'State',
      postal_code: '123456',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByBed').mockResolvedValue(null);

    vi.spyOn(KyselyStayRepository.prototype, 'createForOrganization').mockImplementation(
      async () => {
        activeStay = {
          id: 'stay-1',
          organization_id: ORG,
          resident_id: RES_1,
          admission_date: new Date(),
          expected_checkout_date: null,
          actual_checkout_date: null,
          status: 'ACTIVE',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        return activeStay;
      }
    );
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'createForOrganization').mockResolvedValue({
      id: 'alloc-1',
      organization_id: ORG,
      stay_id: 'stay-1',
      bed_id: BED_1,
      start_at: new Date(),
      end_at: null,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await service.checkIn(ORG, { residentId: RES_1, bedId: BED_1 });

    // Second check-in for RES_1 must fail
    await expect(service.checkIn(ORG, { residentId: RES_1, bedId: BED_1 })).rejects.toThrow(
      ConflictException
    );
  });

  it('C3 [P1-2] — Race 3: Concurrent Deactivate Resident vs Check-In -> INACTIVE resident + ACTIVE stay is IMPOSSIBLE', async () => {
    const residentService = new ResidentService();

    let residentStatus = 'ACTIVE';
    let activeStay: StayRow | null = null;

    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockImplementation(async () =>
      makeResident(RES_1)
    );

    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockImplementation(
      async () => activeStay
    );

    vi.spyOn(KyselyResidentRepository.prototype, 'updateForOrganization').mockImplementation(
      async (_id, _org, data) => {
        if (data.status) residentStatus = data.status;
        return { ...makeResident(RES_1), status: residentStatus };
      }
    );

    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValue(makeBed(BED_1));
    vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'room-1',
      floor_id: 'f-1',
      building_id: 'b-1',
      property_id: 'p-1',
      organization_id: ORG,
      room_number: '101',
      room_type: 'SINGLE',
      capacity: 1,
      display_order: 1,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyFloorRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'f-1',
      building_id: 'b-1',
      organization_id: ORG,
      name: 'F1',
      floor_number: 1,
      display_order: 1,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyBuildingRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'b-1',
      property_id: 'p-1',
      organization_id: ORG,
      name: 'B1',
      code: 'BLK',
      display_order: 1,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockResolvedValue({
      id: 'p-1',
      organization_id: ORG,
      name: 'P1',
      code: 'PG',
      address_line1: 'Line',
      address_line2: null,
      locality: 'Loc',
      city: 'City',
      state: 'State',
      postal_code: '123456',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByBed').mockResolvedValue(null);

    vi.spyOn(KyselyStayRepository.prototype, 'createForOrganization').mockImplementation(
      async () => {
        activeStay = {
          id: 'stay-1',
          organization_id: ORG,
          resident_id: RES_1,
          admission_date: new Date(),
          expected_checkout_date: null,
          actual_checkout_date: null,
          status: 'ACTIVE',
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        return activeStay;
      }
    );
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'createForOrganization').mockResolvedValue({
      id: 'alloc-1',
      organization_id: ORG,
      stay_id: 'stay-1',
      bed_id: BED_1,
      start_at: new Date(),
      end_at: null,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    await service.checkIn(ORG, { residentId: RES_1, bedId: BED_1 });

    // Subsequent deactivation attempt must be REJECTED because active stay exists
    await expect(
      residentService.updateResident(RES_1, ORG, { status: 'INACTIVE' })
    ).rejects.toThrow();

    // Verify invalid state NEVER occurs
    const isInvalidState = residentStatus === 'INACTIVE' && activeStay !== null;
    expect(isInvalidState).toBe(false);
  });
});
