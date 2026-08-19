import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBedRepository,
  KyselyBuildingRepository,
  KyselyFacilityRepository,
  KyselyFloorRepository,
  KyselyPropertyRepository,
  KyselyRoomRepository,
} from '@m-square/database';
import { FloorRoomBedService } from '../modules/inventory/services/floor-room-bed.service';
import { FacilityService } from '../modules/inventory/services/facility.service';

const ORG_A = 'org-tenant-a';
const ORG_B = 'org-tenant-b';

describe('apps/api — M11 Tenant Isolation & Security Unit Suite', () => {
  let floorRoomBedService: FloorRoomBedService;
  let facilityService: FacilityService;
  let roomRepo: KyselyRoomRepository;
  let bedRepo: KyselyBedRepository;
  let facilityRepo: KyselyFacilityRepository;
  let propertyRepo: KyselyPropertyRepository;
  let buildingRepo: KyselyBuildingRepository;
  let floorRepo: KyselyFloorRepository;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roomRepo = new KyselyRoomRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bedRepo = new KyselyBedRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    facilityRepo = new KyselyFacilityRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyRepo = new KyselyPropertyRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buildingRepo = new KyselyBuildingRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    floorRepo = new KyselyFloorRepository({} as any);

    floorRoomBedService = new FloorRoomBedService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (floorRoomBedService as any).roomRepo = roomRepo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (floorRoomBedService as any).bedRepo = bedRepo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (floorRoomBedService as any).buildingRepo = buildingRepo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (floorRoomBedService as any).floorRepo = floorRepo;

    facilityService = new FacilityService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (facilityService as any).facilityRepo = facilityRepo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (facilityService as any).propertyRepo = propertyRepo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (facilityService as any).buildingRepo = buildingRepo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (facilityService as any).roomRepo = roomRepo;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ISO1 — ORG_A cannot read ORG_B building occupancy tree', async () => {
    vi.spyOn(roomRepo, 'findBuildingOccupancyTree').mockResolvedValue(null);

    await expect(
      floorRoomBedService.getBuildingOccupancyTree('org-b-building-id', ORG_A)
    ).rejects.toThrow(NotFoundException);
  });

  it('ISO2 — ORG_A cannot read ORG_B room details', async () => {
    vi.spyOn(roomRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(floorRoomBedService.getRoomById('org-b-room-id', ORG_A)).rejects.toThrow(
      NotFoundException
    );
  });

  it('ISO3 — ORG_A cannot update ORG_B room details', async () => {
    vi.spyOn(roomRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(
      floorRoomBedService.updateRoom('org-b-room-id', ORG_A, { roomNumber: '999' })
    ).rejects.toThrow(NotFoundException);
  });

  it('ISO4 — ORG_A cannot delete ORG_B room', async () => {
    vi.spyOn(roomRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(floorRoomBedService.deleteRoom('org-b-room-id', ORG_A)).rejects.toThrow(
      NotFoundException
    );
  });

  it('ISO5 — ORG_A cannot update ORG_B bed status', async () => {
    vi.spyOn(bedRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(
      floorRoomBedService.updateBedStatus('org-b-bed-id', ORG_A, { status: 'MAINTENANCE' })
    ).rejects.toThrow(NotFoundException);
  });

  it('ISO6 — ORG_A cannot delete ORG_B bed', async () => {
    vi.spyOn(bedRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(floorRoomBedService.deleteBed('org-b-bed-id', ORG_A)).rejects.toThrow(
      NotFoundException
    );
  });

  it('ISO7 — ORG_A cannot assign ORG_B facility to a room', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(roomRepo, 'findByIdForOrganization').mockResolvedValue({ id: 'room-a' } as any);
    vi.spyOn(facilityRepo, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(
      facilityService.assignFacilityToRoom('room-a', 'org-b-facility-id', ORG_A)
    ).rejects.toThrow(NotFoundException);
  });
});
