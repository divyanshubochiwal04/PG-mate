import { describe, expect, it } from 'vitest';
import { validate } from 'class-validator';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import { CreateRoomDto } from '../modules/inventory/dto/create-room.dto';
import { UpdateCapacityDto } from '../modules/inventory/dto/update-capacity.dto';
import { UpdateBedStatusDto } from '../modules/inventory/dto/update-bed-status.dto';
import { CreateBedDto } from '../modules/inventory/dto/create-bed.dto';
import { CreateFacilityDto } from '../modules/inventory/dto/create-facility.dto';
import { CreatePropertyDto } from '../modules/inventory/dto/create-property.dto';

describe('apps/api — M5 Input Validation & DTO Boundary Tests', () => {
  describe('G1: CreateRoomDto / UpdateCapacityDto capacity boundary validation', () => {
    it('rejects capacity = 0 on CreateRoomDto', async () => {
      const dto = new CreateRoomDto();
      dto.roomNumber = '101';
      dto.capacity = 0; // violating @Min(1)

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'capacity')).toBe(true);
    });

    it('rejects negative capacity on UpdateCapacityDto', async () => {
      const dto = new UpdateCapacityDto();
      dto.capacity = -5; // violating @Min(1)

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'capacity')).toBe(true);
    });

    it('accepts valid capacity = 1', async () => {
      const dto = new UpdateCapacityDto();
      dto.capacity = 1;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('G2: UpdateBedStatusDto status enum validation', () => {
    it('rejects invalid bed status string like "INVALID_STATUS"', async () => {
      const dto = new UpdateBedStatusDto();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dto as any).status = 'INVALID_STATUS';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'status')).toBe(true);
    });

    it('accepts valid bed status "MAINTENANCE"', async () => {
      const dto = new UpdateBedStatusDto();
      dto.status = 'MAINTENANCE';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('G3: Empty roomNumber & bedNumber validation', () => {
    it('rejects empty string roomNumber on CreateRoomDto', async () => {
      const dto = new CreateRoomDto();
      dto.roomNumber = '';
      dto.capacity = 2;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'roomNumber')).toBe(true);
    });

    it('rejects empty string bedNumber on CreateBedDto', async () => {
      const dto = new CreateBedDto();
      dto.bedNumber = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'bedNumber')).toBe(true);
    });
  });

  describe('G4: Facility DTO validation', () => {
    it('rejects invalid facility category', async () => {
      const dto = new CreateFacilityDto();
      dto.name = 'Wifi';
      dto.code = 'WIFI';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dto as any).category = 'INVALID_CATEGORY';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'category')).toBe(true);
    });
  });

  describe('G5: Property DTO validation', () => {
    it('rejects empty property name', async () => {
      const dto = new CreatePropertyDto();
      dto.name = '';
      dto.code = 'PROP01';
      dto.addressLine1 = 'Line 1';
      dto.locality = 'Loc';
      dto.city = 'City';
      dto.state = 'State';
      dto.postalCode = '123456';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });
  });
});
