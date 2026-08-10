import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBuildingRepository,
  KyselyFacilityRepository,
  KyselyFloorRepository,
  KyselyPropertyRepository,
  KyselyRoomRepository,
} from '@m-square/database';
import type { FacilityRow, PropertyRow, RoomRow } from '@m-square/database';
import { PropertyBuildingService } from '../modules/inventory/services/property-building.service';
import { FloorRoomBedService } from '../modules/inventory/services/floor-room-bed.service';
import { FacilityService } from '../modules/inventory/services/facility.service';

const OWNER_A_ORG = 'org-owner-a';
const OWNER_B_ORG = 'org-owner-b';

function makeProperty(orgId: string): PropertyRow {
  return {
    id: 'prop-a',
    organization_id: orgId,
    name: 'Owner A Property',
    code: 'PROP-A',
    address_line1: '123 Main St',
    address_line2: null,
    locality: 'Central',
    city: 'Metropolis',
    state: 'State',
    postal_code: '123456',
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeRoom(orgId: string): RoomRow {
  return {
    id: 'room-a',
    floor_id: 'floor-a',
    building_id: 'bldg-a',
    property_id: 'prop-a',
    organization_id: orgId,
    room_number: '101',
    room_type: 'SINGLE',
    capacity: 1,
    display_order: 1,
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeFacility(orgId: string): FacilityRow {
  return {
    id: 'fac-b',
    organization_id: orgId,
    name: 'Owner B Wifi',
    code: 'WIFI-B',
    category: 'UTILITY',
    description: '100 Mbps',
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('apps/api — M5 Tenant Isolation & Facility Cross-Tenant Security', () => {
  let pbService: PropertyBuildingService;
  let frbService: FloorRoomBedService;
  let facService: FacilityService;

  beforeEach(() => {
    pbService = new PropertyBuildingService();
    frbService = new FloorRoomBedService();
    facService = new FacilityService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('H: Tenant IDOR Tests', () => {
    it('H1 — Owner B GET property owned by Owner A returns 404 Not Found', async () => {
      // Mock repository to return property ONLY if org matches
      vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'prop-a' && orgId === OWNER_A_ORG) {
            return makeProperty(OWNER_A_ORG);
          }
          return null;
        }
      );

      await expect(pbService.getPropertyById('prop-a', OWNER_B_ORG)).rejects.toThrow(
        NotFoundException
      );
    });

    it('H2 — Owner B UPDATE property owned by Owner A returns 404 Not Found', async () => {
      vi.spyOn(KyselyPropertyRepository.prototype, 'updateForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'prop-a' && orgId === OWNER_A_ORG) {
            return makeProperty(OWNER_A_ORG);
          }
          return null;
        }
      );

      await expect(
        pbService.updateProperty('prop-a', OWNER_B_ORG, { name: 'Hacked Name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('H3 — Owner B DELETE property owned by Owner A returns 404 Not Found', async () => {
      vi.spyOn(KyselyPropertyRepository.prototype, 'countBuildingsInProperty').mockResolvedValue(0);
      vi.spyOn(KyselyPropertyRepository.prototype, 'deleteForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'prop-a' && orgId === OWNER_A_ORG) return true;
          return false;
        }
      );

      await expect(pbService.deleteProperty('prop-a', OWNER_B_ORG)).rejects.toThrow(
        NotFoundException
      );
    });

    it('H4 — Owner B create building under Owner A property returns 404 Not Found', async () => {
      vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'prop-a' && orgId === OWNER_A_ORG) return makeProperty(OWNER_A_ORG);
          return null;
        }
      );

      await expect(
        pbService.createBuilding('prop-a', OWNER_B_ORG, { name: 'Rogue Building', code: 'ROGUE' })
      ).rejects.toThrow(NotFoundException);
    });

    it('H5 — Owner B GET building owned by Owner A returns 404 Not Found', async () => {
      vi.spyOn(KyselyBuildingRepository.prototype, 'findByIdForOrganization').mockResolvedValue(null);

      await expect(pbService.getBuildingById('bldg-a', OWNER_B_ORG)).rejects.toThrow(
        NotFoundException
      );
    });

    it('H6 — Owner B GET floor owned by Owner A returns 404 Not Found', async () => {
      vi.spyOn(KyselyFloorRepository.prototype, 'findByIdForOrganization').mockResolvedValue(null);

      await expect(frbService.getFloorById('floor-a', OWNER_B_ORG)).rejects.toThrow(
        NotFoundException
      );
    });

    it('H7 — Owner B GET room owned by Owner A returns 404 Not Found', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForOrganization').mockResolvedValue(null);

      await expect(frbService.getRoomById('room-a', OWNER_B_ORG)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('I: Facility Cross-Tenant Assignment Tests', () => {
    it('I1 — Attempt assigning Owner B Facility B to Owner A Property A returns 404 Not Found', async () => {
      // Owner A property exists for Owner A, but not for Owner B
      vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'prop-a' && orgId === OWNER_A_ORG) return makeProperty(OWNER_A_ORG);
          return null;
        }
      );
      vi.spyOn(KyselyFacilityRepository.prototype, 'findByIdForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'fac-b' && orgId === OWNER_B_ORG) return makeFacility(OWNER_B_ORG);
          return null;
        }
      );

      // Caller is Owner A trying to attach fac-b (which belongs to Owner B)
      await expect(
        facService.assignFacilityToProperty('prop-a', 'fac-b', OWNER_A_ORG)
      ).rejects.toThrow(NotFoundException);
    });

    it('I2 — Attempt assigning Owner B Facility B to Owner A Room A returns 404 Not Found', async () => {
      vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'room-a' && orgId === OWNER_A_ORG) return makeRoom(OWNER_A_ORG);
          return null;
        }
      );
      vi.spyOn(KyselyFacilityRepository.prototype, 'findByIdForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'fac-b' && orgId === OWNER_B_ORG) return makeFacility(OWNER_B_ORG);
          return null;
        }
      );

      // Caller is Owner A trying to attach fac-b (which belongs to Owner B)
      await expect(
        facService.assignFacilityToRoom('room-a', 'fac-b', OWNER_A_ORG)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
