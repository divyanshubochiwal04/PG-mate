import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBedRepository,
  KyselyBuildingRepository,
  KyselyFacilityRepository,
  KyselyFloorRepository,
  KyselyPropertyRepository,
  KyselyRoomRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { BuildingRow, FacilityRow, FloorRow, PropertyRow, RoomRow } from '@m-square/database';
import { BuildingSetupService } from '../modules/inventory/services/building-setup.service';

const ORG = 'org-setup-unit';
const PROP_1 = 'prop-1';
const FAC_1 = 'fac-1';
const FAC_2 = 'fac-2';

function makeProperty(): PropertyRow {
  return {
    id: PROP_1,
    organization_id: ORG,
    name: 'Main PG',
    code: 'PG-01',
    address_line1: 'Line 1',
    address_line2: null,
    locality: 'Loc',
    city: 'City',
    state: 'State',
    postal_code: '302001',
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeBuilding(): BuildingRow {
  return {
    id: 'bldg-1',
    property_id: PROP_1,
    organization_id: ORG,
    name: 'Block A',
    code: 'BLK-A',
    display_order: 1,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeFloor(): FloorRow {
  return {
    id: 'floor-1',
    building_id: 'bldg-1',
    organization_id: ORG,
    name: 'Ground Floor',
    floor_number: 0,
    display_order: 0,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeRoom(): RoomRow {
  return {
    id: 'room-1',
    floor_id: 'floor-1',
    building_id: 'bldg-1',
    property_id: PROP_1,
    organization_id: ORG,
    room_number: '101',
    room_type: 'DOUBLE',
    capacity: 2,
    display_order: 1,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeFacility(id: string): FacilityRow {
  return {
    id,
    organization_id: ORG,
    name: `Facility ${id}`,
    code: `FAC-${id}`,
    category: 'GENERAL',
    description: null,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('apps/api — M10 Building Setup Wizard Unit Suite', () => {
  let service: BuildingSetupService;
  let unitOfWork: KyselyUnitOfWork;
  let propertyRepo: KyselyPropertyRepository;
  let buildingRepo: KyselyBuildingRepository;
  let floorRepo: KyselyFloorRepository;
  let roomRepo: KyselyRoomRepository;
  let bedRepo: KyselyBedRepository;
  let facilityRepo: KyselyFacilityRepository;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unitOfWork = new KyselyUnitOfWork({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyRepo = new KyselyPropertyRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buildingRepo = new KyselyBuildingRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    floorRepo = new KyselyFloorRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roomRepo = new KyselyRoomRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bedRepo = new KyselyBedRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    facilityRepo = new KyselyFacilityRepository({} as any);

    service = new BuildingSetupService(
      unitOfWork,
      propertyRepo,
      buildingRepo,
      floorRepo,
      roomRepo,
      bedRepo,
      facilityRepo
    );

    vi.spyOn(unitOfWork, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn) => fn({} as any)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('BSW1 — successful atomic Building Setup orchestration', async () => {
    vi.spyOn(propertyRepo, 'findByIdForOrganization').mockResolvedValue(makeProperty());
    vi.spyOn(buildingRepo, 'findAllByProperty').mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        pageSize: 100,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });
    vi.spyOn(facilityRepo, 'findByIdForOrganization').mockImplementation(async (id) =>
      makeFacility(id)
    );
    vi.spyOn(buildingRepo, 'createForOrganization').mockResolvedValue(makeBuilding());
    vi.spyOn(floorRepo, 'createForOrganization').mockResolvedValue(makeFloor());
    vi.spyOn(roomRepo, 'createForOrganization').mockResolvedValue(makeRoom());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(bedRepo, 'createForOrganization').mockResolvedValue({} as any);
    vi.spyOn(facilityRepo, 'assignToRoom').mockResolvedValue(true);

    const result = await service.setupBuilding(ORG, {
      propertyId: PROP_1,
      building: { name: 'Block A', code: 'BLK-A' },
      floors: [
        {
          name: 'Ground Floor',
          floorNumber: 0,
          rooms: [
            { roomNumber: '101', capacity: 2, facilityIds: [FAC_1, FAC_2] },
            { roomNumber: '102', capacity: 2, facilityIds: [FAC_1] },
          ],
        },
      ],
    });

    expect(result.building.code).toBe('BLK-A');
    expect(result.floorsCount).toBe(1);
    expect(result.roomsCount).toBe(2);
    expect(result.bedsCount).toBe(4);
    expect(result.assignedFacilitiesCount).toBe(3);
  });

  it('BSW2 — rejects setup if Property is not found or access denied', async () => {
    vi.spyOn(propertyRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(
      service.setupBuilding(ORG, {
        propertyId: 'invalid-prop',
        building: { name: 'Block A', code: 'BLK-A' },
        floors: [],
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('BSW3 — rejects setup if Building code already exists under property (409 Conflict)', async () => {
    vi.spyOn(propertyRepo, 'findByIdForOrganization').mockResolvedValue(makeProperty());
    vi.spyOn(buildingRepo, 'findAllByProperty').mockResolvedValue({
      items: [makeBuilding()],
      pagination: {
        page: 1,
        pageSize: 100,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });

    await expect(
      service.setupBuilding(ORG, {
        propertyId: PROP_1,
        building: { name: 'Block A Duplicate', code: 'BLK-A' },
        floors: [],
      })
    ).rejects.toThrow(ConflictException);
  });

  it('BSW4 — rejects setup if request contains duplicate room numbers', async () => {
    vi.spyOn(propertyRepo, 'findByIdForOrganization').mockResolvedValue(makeProperty());
    vi.spyOn(buildingRepo, 'findAllByProperty').mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        pageSize: 100,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });

    await expect(
      service.setupBuilding(ORG, {
        propertyId: PROP_1,
        building: { name: 'Block B', code: 'BLK-B' },
        floors: [
          {
            name: 'Ground Floor',
            floorNumber: 0,
            rooms: [
              { roomNumber: '101', capacity: 2 },
              { roomNumber: '101', capacity: 2 }, // Duplicate!
            ],
          },
        ],
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('BSW5 — rejects setup if a facilityId belongs to another organization (Cross-tenant guard)', async () => {
    vi.spyOn(propertyRepo, 'findByIdForOrganization').mockResolvedValue(makeProperty());
    vi.spyOn(buildingRepo, 'findAllByProperty').mockResolvedValue({
      items: [],
      pagination: {
        page: 1,
        pageSize: 100,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });
    vi.spyOn(facilityRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(
      service.setupBuilding(ORG, {
        propertyId: PROP_1,
        building: { name: 'Block C', code: 'BLK-C' },
        floors: [
          {
            name: 'Ground Floor',
            floorNumber: 0,
            rooms: [{ roomNumber: '101', capacity: 2, facilityIds: ['other-org-facility'] }],
          },
        ],
      })
    ).rejects.toThrow(NotFoundException);
  });
});
