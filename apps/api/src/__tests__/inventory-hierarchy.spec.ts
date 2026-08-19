import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBedRepository,
  KyselyBuildingRepository,
  KyselyFloorRepository,
  KyselyPropertyRepository,
  KyselyRoomRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { BuildingRow, FloorRow, PropertyRow, RoomRow } from '@m-square/database';
import { PropertyBuildingService } from '../modules/inventory/services/property-building.service';
import { FloorRoomBedService } from '../modules/inventory/services/floor-room-bed.service';

const ORG = 'org-a';

function makeProperty(overrides: Partial<PropertyRow> = {}): PropertyRow {
  return {
    id: 'prop-1',
    organization_id: ORG,
    name: 'Test Property',
    code: 'P01',
    address_line1: '123 Main St',
    address_line2: null,
    locality: 'Central',
    city: 'Metropolis',
    state: 'State',
    postal_code: '123456',
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeBuilding(overrides: Partial<BuildingRow> = {}): BuildingRow {
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
    ...overrides,
  };
}

function makeFloor(overrides: Partial<FloorRow> = {}): FloorRow {
  return {
    id: 'floor-1',
    building_id: 'bldg-1',
    organization_id: ORG,
    name: 'First Floor',
    floor_number: 1,
    display_order: 1,
    status: 'ACTIVE',
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
    room_type: 'DOUBLE',
    capacity: 2,
    display_order: 1,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('apps/api — M5 Hierarchy Integrity & Uniqueness', () => {
  let pbService: PropertyBuildingService;
  let frbService: FloorRoomBedService;

  beforeEach(() => {
    pbService = new PropertyBuildingService();
    frbService = new FloorRoomBedService();
    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn) => fn({} as any)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('E: Inactive parent prevention', () => {
    it('E1 — INACTIVE Property -> rejects Building creation with 400', async () => {
      vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeProperty({ status: 'INACTIVE' })
      );

      await expect(
        pbService.createBuilding('prop-1', ORG, { name: 'Block B', code: 'BLK-B' })
      ).rejects.toThrow(BadRequestException);
    });

    it('E2 — INACTIVE Building -> rejects Floor creation with 400', async () => {
      vi.spyOn(KyselyBuildingRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeBuilding({ status: 'INACTIVE' })
      );

      await expect(
        frbService.createFloor('bldg-1', ORG, { name: 'Floor 2', floorNumber: 2 })
      ).rejects.toThrow(BadRequestException);
    });

    it('E3 — INACTIVE Floor -> rejects Room creation with 400', async () => {
      vi.spyOn(KyselyFloorRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeFloor({ status: 'INACTIVE' })
      );

      await expect(
        frbService.createRoom('floor-1', ORG, { roomNumber: '102', capacity: 2 })
      ).rejects.toThrow(BadRequestException);
    });

    it('E4 — INACTIVE Room -> rejects Bed creation with 400', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ status: 'INACTIVE' })
      );

      await expect(frbService.createBed('room-1', ORG, { bedNumber: 'B1' })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('F: Uniqueness tests (409 Conflict)', () => {
    it('F1 — duplicate property code within same org throws 409 Conflict', async () => {
      const err = new Error('Unique constraint violation');
      (err as { code?: string }).code = '23505';

      vi.spyOn(KyselyPropertyRepository.prototype, 'createForOrganization').mockRejectedValue(err);

      await expect(
        pbService.createProperty(ORG, {
          name: 'Prop Dup',
          code: 'P01',
          addressLine1: 'Addr',
          locality: 'Loc',
          city: 'City',
          state: 'State',
          postalCode: '123456',
        })
      ).rejects.toThrow(ConflictException);
    });

    it('F2 — duplicate building code in same property throws 409 Conflict', async () => {
      vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeProperty()
      );

      const err = new Error('Unique constraint violation');
      (err as { code?: string }).code = '23505';
      vi.spyOn(KyselyBuildingRepository.prototype, 'createForOrganization').mockRejectedValue(err);

      await expect(
        pbService.createBuilding('prop-1', ORG, { name: 'Block A', code: 'BLK-A' })
      ).rejects.toThrow(ConflictException);
    });

    it('F3 — duplicate floor number in same building throws 409 Conflict', async () => {
      vi.spyOn(KyselyBuildingRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeBuilding()
      );

      const err = new Error('Unique constraint violation');
      (err as { code?: string }).code = '23505';
      vi.spyOn(KyselyFloorRepository.prototype, 'createForOrganization').mockRejectedValue(err);

      await expect(
        frbService.createFloor('bldg-1', ORG, { name: 'Floor 1', floorNumber: 1 })
      ).rejects.toThrow(ConflictException);
    });

    it('F4 — duplicate room number on same floor throws 409 Conflict', async () => {
      vi.spyOn(KyselyFloorRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeFloor()
      );
      vi.spyOn(KyselyBuildingRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
        makeBuilding()
      );

      const err = new Error('Unique constraint violation');
      (err as { code?: string }).code = '23505';
      vi.spyOn(KyselyRoomRepository.prototype, 'createForOrganization').mockRejectedValue(err);

      await expect(
        frbService.createRoom('floor-1', ORG, { roomNumber: '101', capacity: 2 })
      ).rejects.toThrow(ConflictException);
    });

    it('F5 — duplicate bed number in same room throws 409 Conflict', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeRoom({ capacity: 2 })
      );
      vi.spyOn(KyselyBedRepository.prototype, 'countActiveBedsInRoom').mockResolvedValue(0);

      const err = new Error('Unique constraint violation');
      (err as { code?: string }).code = '23505';
      vi.spyOn(KyselyBedRepository.prototype, 'createForOrganization').mockRejectedValue(err);

      await expect(frbService.createBed('room-1', ORG, { bedNumber: 'B1' })).rejects.toThrow(
        ConflictException
      );
    });
  });
});
