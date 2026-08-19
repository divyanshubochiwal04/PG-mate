import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import { KyselyBedRepository, KyselyRoomRepository, KyselyUnitOfWork } from '@m-square/database';
import type { BedRow, RoomRow } from '@m-square/database';
import { FloorRoomBedService } from '../modules/inventory/services/floor-room-bed.service';

const ORG = 'org-a';
const ROOM_ID = 'room-1';
const BED_A = 'bed-a';
const BED_B = 'bed-b';

function makeRoom(overrides: Partial<RoomRow> = {}): RoomRow {
  return {
    id: ROOM_ID,
    floor_id: 'floor-1',
    building_id: 'building-1',
    property_id: 'property-1',
    organization_id: ORG,
    room_number: '101',
    room_type: 'DOUBLE',
    capacity: 2,
    display_order: 0,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeBed(overrides: Partial<BedRow> = {}): BedRow {
  return {
    id: BED_A,
    room_id: ROOM_ID,
    organization_id: ORG,
    bed_number: 'B1',
    display_order: 0,
    status: 'AVAILABLE',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('apps/api — M5 Capacity Enforcement', () => {
  let service: FloorRoomBedService;

  beforeEach(() => {
    service = new FloorRoomBedService();
    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn) => fn({} as any)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('A: Basic capacity enforcement', () => {
    it('A1 — allows first bed when room is empty (cap=1, active=0)', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 1 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(0);
      vi.spyOn(KyselyBedRepository.prototype, 'createForOrganization').mockResolvedValue(makeBed());

      const result = await service.createBed(ROOM_ID, ORG, { bedNumber: 'B1' });
      expect(result.bedNumber).toBe('B1');
      expect(result.status).toBe('AVAILABLE');
    });

    it('A2 — rejects second bed when room capacity is 1 and active=1', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 1 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(1);

      await expect(service.createBed(ROOM_ID, ORG, { bedNumber: 'B2' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('A3 — allows two beds when cap=2 (second bed: active=1)', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 2 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(1);
      vi.spyOn(KyselyBedRepository.prototype, 'createForOrganization').mockResolvedValue(
        makeBed({ bed_number: 'B2' })
      );

      const result = await service.createBed(ROOM_ID, ORG, { bedNumber: 'B2' });
      expect(result.bedNumber).toBe('B2');
    });

    it('A4 — throws NotFoundException when room does not belong to organization', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(null);

      await expect(service.createBed(ROOM_ID, 'other-org', { bedNumber: 'B1' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('B: MAINTENANCE status counts toward capacity', () => {
    it('B1 — rejects new bed when MAINTENANCE bed occupies capacity slot (active=1, cap=1)', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 1 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(1);

      await expect(service.createBed(ROOM_ID, ORG, { bedNumber: 'B2' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('B2 — allows bed creation when cap=2 and MAINTENANCE bed occupies 1 slot (active=1)', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 2 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(1);
      vi.spyOn(KyselyBedRepository.prototype, 'createForOrganization').mockResolvedValue(
        makeBed({ status: 'AVAILABLE', bed_number: 'B2' })
      );

      const result = await service.createBed(ROOM_ID, ORG, { bedNumber: 'B2' });
      expect(result).toBeDefined();
    });

    it('B3 — rejects reactivation to MAINTENANCE when room capacity is full (active=1, cap=1)', async () => {
      const inactiveBed = makeBed({ id: BED_B, status: 'INACTIVE', bed_number: 'B2' });

      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        inactiveBed
      );
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 1 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(1);

      await expect(service.updateBedStatus(BED_B, ORG, { status: 'MAINTENANCE' })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('C: INACTIVE does not count toward capacity', () => {
    it('C1 — allows AVAILABLE bed creation when only INACTIVE bed exists (active=0, cap=1)', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 1 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(0);
      vi.spyOn(KyselyBedRepository.prototype, 'createForOrganization').mockResolvedValue(
        makeBed({ status: 'AVAILABLE' })
      );

      const result = await service.createBed(ROOM_ID, ORG, { bedNumber: 'B-AVAIL' });
      expect(result.status).toBe('AVAILABLE');
    });

    it('C2 — allows active bed creation in cap=2 room when one INACTIVE bed exists (active=1)', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 2 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(1);
      vi.spyOn(KyselyBedRepository.prototype, 'createForOrganization').mockResolvedValue(
        makeBed({ bed_number: 'B-NEW' })
      );

      const result = await service.createBed(ROOM_ID, ORG, { bedNumber: 'B-NEW' });
      expect(result).toBeDefined();
    });
  });

  describe('D: Reactivation block and allow', () => {
    it('D1 — blocks INACTIVE -> AVAILABLE when room is at full capacity (cap=1, active=1)', async () => {
      const inactiveBed = makeBed({ id: BED_B, status: 'INACTIVE', bed_number: 'B2' });

      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        inactiveBed
      );
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 1 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(1);

      await expect(service.updateBedStatus(BED_B, ORG, { status: 'AVAILABLE' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('D2 — blocks INACTIVE -> MAINTENANCE when room is at full capacity (cap=1, active=1)', async () => {
      const inactiveBed = makeBed({ id: BED_B, status: 'INACTIVE', bed_number: 'B2' });

      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        inactiveBed
      );
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 1 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(1);

      await expect(service.updateBedStatus(BED_B, ORG, { status: 'MAINTENANCE' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('D3 — allows INACTIVE -> AVAILABLE after deactivating an active bed (active=0)', async () => {
      const inactiveBed = makeBed({ id: BED_B, status: 'INACTIVE', bed_number: 'B2' });
      const reactivated: BedRow = { ...inactiveBed, status: 'AVAILABLE' };

      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        inactiveBed
      );
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 1 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(0);
      vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValue(reactivated);

      const result = await service.updateBedStatus(BED_B, ORG, { status: 'AVAILABLE' });
      expect(result.status).toBe('AVAILABLE');
    });

    it('D4 — allows AVAILABLE -> INACTIVE without triggering capacity check', async () => {
      const activeBed = makeBed({ id: BED_A, status: 'AVAILABLE' });
      const deactivated: BedRow = { ...activeBed, status: 'INACTIVE' };

      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        activeBed
      );
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 1 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(1);
      vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValue(deactivated);

      const result = await service.updateBedStatus(BED_A, ORG, { status: 'INACTIVE' });
      expect(result.status).toBe('INACTIVE');
    });

    it('D5 — capacity reduction below active beds count is rejected', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 3 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(2);

      await expect(service.updateRoomCapacity(ROOM_ID, ORG, { capacity: 1 })).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
