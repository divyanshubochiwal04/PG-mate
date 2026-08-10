import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyEmergencyContactRepository,
  KyselyResidentRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { EmergencyContactRow, ResidentRow } from '@m-square/database';
import { EmergencyContactService } from '../modules/resident/services/emergency-contact.service';

const ORG = 'org-em-contact';
const RES_ID = 'res-1';
const CONTACT_1 = 'contact-1';
const CONTACT_2 = 'contact-2';

function makeResident(): ResidentRow {
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
  };
}

function makeContact(overrides: Partial<EmergencyContactRow> = {}): EmergencyContactRow {
  return {
    id: CONTACT_1,
    resident_id: RES_ID,
    organization_id: ORG,
    name: 'Robert Doe',
    relationship: 'PARENT',
    phone: '+919876543219',
    alternate_phone: null,
    is_primary: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('apps/api — M6 Emergency Contact & Primary Invariant Suite', () => {
  let service: EmergencyContactService;

  beforeEach(() => {
    service = new EmergencyContactService();
    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (fn) => fn({} as any)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('EC1 — automatically sets first contact as primary', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      makeResident()
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findAllByResident').mockResolvedValue(
      []
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'unsetPrimaryForResident').mockResolvedValue(
      undefined
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'createForResident').mockResolvedValue(
      makeContact({ is_primary: true })
    );

    const contact = await service.createContact(RES_ID, ORG, {
      name: 'Robert Doe',
      relationship: 'PARENT',
      phone: '+919876543219',
    });

    expect(contact.isPrimary).toBe(true);
  });

  it('EC2 — creating second primary contact unsets previous primary (P1-1 rule)', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      makeResident()
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findAllByResident').mockResolvedValue([
      makeContact({ is_primary: true }),
    ]);
    const unsetSpy = vi
      .spyOn(KyselyEmergencyContactRepository.prototype, 'unsetPrimaryForResident')
      .mockResolvedValue(undefined);
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'createForResident').mockResolvedValue(
      makeContact({ id: CONTACT_2, name: 'Mary Doe', is_primary: true })
    );

    const newContact = await service.createContact(RES_ID, ORG, {
      name: 'Mary Doe',
      relationship: 'PARENT',
      phone: '+919876543218',
      isPrimary: true,
    });

    expect(unsetSpy).toHaveBeenCalledWith(RES_ID, ORG, expect.anything());
    expect(newContact.isPrimary).toBe(true);
  });

  it('EC3 — rejects unsetting primary on sole contact (P1-1 rule)', async () => {
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      makeContact({ is_primary: true })
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findAllByResident').mockResolvedValue([
      makeContact({ is_primary: true }),
    ]);

    await expect(
      service.updateContact(CONTACT_1, ORG, { isPrimary: false })
    ).rejects.toThrow(BadRequestException);
  });

  it('EC4 — deleting primary contact auto-promotes next contact to primary (P1-1 rule)', async () => {
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      makeContact({ id: CONTACT_1, is_primary: true })
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'deleteForResident').mockResolvedValue(
      true
    );
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findAllByResident').mockResolvedValue([
      makeContact({ id: CONTACT_2, is_primary: false }),
    ]);
    const updateSpy = vi
      .spyOn(KyselyEmergencyContactRepository.prototype, 'updateForResident')
      .mockResolvedValue(makeContact({ id: CONTACT_2, is_primary: true }));

    await service.deleteContact(CONTACT_1, ORG);

    expect(updateSpy).toHaveBeenCalledWith(
      CONTACT_2,
      ORG,
      { isPrimary: true },
      expect.anything()
    );
  });

  it('EC5 — throws NotFoundException when deleting non-existent contact', async () => {
    vi.spyOn(KyselyEmergencyContactRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      null
    );

    await expect(service.deleteContact('invalid-id', ORG)).rejects.toThrow(NotFoundException);
  });
});
