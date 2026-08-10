import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyBedRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { BedRow, ResidentRow } from '@m-square/database';
import { ResidentService } from '../modules/resident/services/resident.service';
import { EmergencyContactService } from '../modules/resident/services/emergency-contact.service';
import { StayAllocationService } from '../modules/resident/services/stay-allocation.service';

const ORG_A = 'org-owner-a';
const ORG_B = 'org-owner-b';

function makeResident(orgId: string): ResidentRow {
  return {
    id: 'res-a',
    organization_id: orgId,
    resident_code: 'RES-000001',
    first_name: 'Owner A Resident',
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
  };
}

function makeBed(orgId: string): BedRow {
  return {
    id: 'bed-b',
    room_id: 'room-b',
    organization_id: orgId,
    bed_number: 'B-B',
    display_order: 1,
    status: 'AVAILABLE',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

describe('apps/api — M6 Tenant Isolation & Cross-Tenant Security Suite', () => {
  let residentService: ResidentService;
  let contactService: EmergencyContactService;
  let stayService: StayAllocationService;

  beforeEach(() => {
    residentService = new ResidentService();
    contactService = new EmergencyContactService();
    stayService = new StayAllocationService();
    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn) => fn({} as any)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Resident Tenant Isolation (IDOR Rejection)', () => {
    it('T1 — Owner B GET resident owned by Owner A returns 404 Not Found', async () => {
      vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'res-a' && orgId === ORG_A) return makeResident(ORG_A);
          return null;
        }
      );

      await expect(residentService.getResidentById('res-a', ORG_B)).rejects.toThrow(
        NotFoundException
      );
    });

    it('T2 — Owner B UPDATE resident owned by Owner A returns 404 Not Found', async () => {
      vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockImplementation(
        async (id, orgId) => {
          if (id === 'res-a' && orgId === ORG_A) return makeResident(ORG_A);
          return null;
        }
      );
      vi.spyOn(KyselyResidentRepository.prototype, 'updateForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'res-a' && orgId === ORG_A) return makeResident(ORG_A);
          return null;
        }
      );

      await expect(
        residentService.updateResident('res-a', ORG_B, { firstName: 'Hacked' })
      ).rejects.toThrow(NotFoundException);
    });

    it('T3 — Owner B GET resident history owned by Owner A returns 404 Not Found', async () => {
      vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'res-a' && orgId === ORG_A) return makeResident(ORG_A);
          return null;
        }
      );

      await expect(residentService.getResidentHistory('res-a', ORG_B)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('Emergency Contact Tenant Isolation', () => {
    it('T4 — Owner B GET emergency contacts for Owner A resident returns 404 Not Found', async () => {
      vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockImplementation(
        async (id, orgId) => {
          if (id === 'res-a' && orgId === ORG_A) return makeResident(ORG_A);
          return null;
        }
      );

      await expect(contactService.getContacts('res-a', ORG_B)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Cross-Tenant Allocation Security', () => {
    it('T5 — Owner A attempts allocating Owner B bed to Owner A resident -> 404 Not Found', async () => {
      vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValue(
        makeResident(ORG_A)
      );
      vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(null);
      // Bed belongs to ORG_B, so lookup under ORG_A returns null
      vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockImplementation(
        async (id, orgId) => {
          if (id === 'bed-b' && orgId === ORG_B) return makeBed(ORG_B);
          return null;
        }
      );

      await expect(
        stayService.checkIn(ORG_A, { residentId: 'res-a', bedId: 'bed-b' })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
