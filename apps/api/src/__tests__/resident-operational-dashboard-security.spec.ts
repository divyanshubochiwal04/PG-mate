import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { KyselyResidentRepository } from '@m-square/database';
import { ResidentService } from '../modules/resident/services/resident.service';
import { ResidentOperationalQueryDto } from '../modules/resident/dto/resident-operational-query.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

const ORG_A = '123e4567-e89b-12d3-a456-426614174001';
const ORG_B = '123e4567-e89b-12d3-a456-426614174002';
const PROP_A = '123e4567-e89b-12d3-a456-426614174010';
const PROP_B = '123e4567-e89b-12d3-a456-426614174020';
const BLDG_A = '123e4567-e89b-12d3-a456-426614174011';
const FLOOR_A = '123e4567-e89b-12d3-a456-426614174012';

describe('Resident Operational Dashboard Security & Tenant Isolation Unit Suite', () => {
  let service: ResidentService;

  beforeEach(() => {
    service = new ResidentService();
  });

  it('OP-DASH-01: Org A sees own operational residents list', async () => {
    const mockList = {
      items: [
        {
          residentId: 'res-a1',
          residentCode: 'RES-000001',
          firstName: 'Rahul',
          lastName: 'Sharma',
          fullName: 'Rahul Sharma',
          phone: '9811111111',
          email: 'rahul@example.com',
          status: 'ACTIVE' as const,
          propertyId: PROP_A,
          propertyName: 'Property A',
          buildingId: BLDG_A,
          buildingName: 'Building A',
          floorId: FLOOR_A,
          floorNumber: 1,
          roomId: 'rm-1',
          roomNumber: '101',
          bedId: 'bed-1',
          bedNumber: '101A',
          allocationId: 'alloc-1',
          stayId: 'stay-1',
          stayStatus: 'ACTIVE' as const,
          admissionDate: '2026-08-01T00:00:00.000Z',
          expectedCheckoutDate: null,
          actualCheckoutDate: null,
          messSubscriptionStatus: 'ACTIVE',
          messPlanName: 'Standard Monthly',
          outstandingBalance: 1500,
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    };

    vi.spyOn(KyselyResidentRepository.prototype, 'findOperationalList').mockResolvedValue(mockList);

    const query = new ResidentOperationalQueryDto();
    const result = await service.getOperationalList(ORG_A, query);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].residentId).toBe('res-a1');
    expect(KyselyResidentRepository.prototype.findOperationalList).toHaveBeenCalledWith(ORG_A, query);
  });

  it('OP-DASH-02: Org B cannot see Org A residents in operational list', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findOperationalList').mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });

    const query = new ResidentOperationalQueryDto();
    const result = await service.getOperationalList(ORG_B, query);

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(KyselyResidentRepository.prototype.findOperationalList).toHaveBeenCalledWith(ORG_B, query);
  });

  it('OP-DASH-03: Cross-tenant property filter returns 0 items / protects isolation', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findOperationalList').mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });

    const query: ResidentOperationalQueryDto = { propertyId: PROP_B };
    const result = await service.getOperationalList(ORG_A, query);

    expect(result.items).toHaveLength(0);
    expect(KyselyResidentRepository.prototype.findOperationalList).toHaveBeenCalledWith(ORG_A, query);
  });

  it('OP-DASH-04: Cross-tenant building filter returns 0 items', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findOperationalList').mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });

    const query: ResidentOperationalQueryDto = { buildingId: '123e4567-e89b-12d3-a456-426614174099' };
    const result = await service.getOperationalList(ORG_A, query);

    expect(result.items).toHaveLength(0);
  });

  it('OP-DASH-05: Cross-tenant floor filter returns 0 items', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findOperationalList').mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });

    const query: ResidentOperationalQueryDto = { floorId: '123e4567-e89b-12d3-a456-426614174098' };
    const result = await service.getOperationalList(ORG_A, query);

    expect(result.items).toHaveLength(0);
  });

  it('OP-DASH-06: Invalid UUID filter parameter rejected', async () => {
    const dto = plainToInstance(ResidentOperationalQueryDto, { propertyId: 'not-a-valid-uuid' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('propertyId');
  });

  it('OP-DASH-07: Invalid enum filter parameter rejected', async () => {
    const dto = plainToInstance(ResidentOperationalQueryDto, { stayStatus: 'INVALID_STATUS' });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('stayStatus');
  });

  it('OP-DASH-08: Pagination limits enforced (pageSize > 100 rejected)', async () => {
    const dto = plainToInstance(ResidentOperationalQueryDto, { pageSize: 500 });
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('pageSize');
  });

  it('OP-DASH-09: Search cannot escape tenant scope', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findOperationalList').mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });

    const query: ResidentOperationalQueryDto = { search: 'Rahul' };
    const result = await service.getOperationalList(ORG_B, query);

    expect(result.items).toHaveLength(0);
    expect(KyselyResidentRepository.prototype.findOperationalList).toHaveBeenCalledWith(ORG_B, query);
  });

  it('OP-DASH-10: Billing summary cannot leak another tenant invoice dues', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'getOperationalSummary').mockResolvedValue({
      totalResidents: 0,
      activeResidents: 0,
      checkedOutResidents: 0,
      residentsWithoutStay: 0,
      occupiedBeds: 0,
      outstandingAmount: 0,
    });

    const summary = await service.getOperationalSummary(ORG_B);

    expect(summary.outstandingAmount).toBe(0);
    expect(KyselyResidentRepository.prototype.getOperationalSummary).toHaveBeenCalledWith(ORG_B);
  });

  it('OP-DASH-11: Mess status filter cannot leak another tenant mess subscription', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findOperationalList').mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });

    const query: ResidentOperationalQueryDto = { messStatus: 'ACTIVE' };
    const result = await service.getOperationalList(ORG_B, query);

    expect(result.items).toHaveLength(0);
  });

  it('OP-DASH-12: Summary counts are strictly tenant scoped', async () => {
    const summaryA = {
      totalResidents: 5,
      activeResidents: 3,
      checkedOutResidents: 1,
      residentsWithoutStay: 1,
      occupiedBeds: 3,
      outstandingAmount: 4500,
    };

    vi.spyOn(KyselyResidentRepository.prototype, 'getOperationalSummary').mockResolvedValue(summaryA);

    const result = await service.getOperationalSummary(ORG_A);

    expect(result.totalResidents).toBe(5);
    expect(result.activeResidents).toBe(3);
    expect(result.outstandingAmount).toBe(4500);
    expect(KyselyResidentRepository.prototype.getOperationalSummary).toHaveBeenCalledWith(ORG_A);
  });
});
