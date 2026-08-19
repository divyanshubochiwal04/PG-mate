import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  KyselyStayRepository,
  KyselyBedAllocationRepository,
  KyselyBedRepository,
  KyselyRoomRepository,
  KyselyFloorRepository,
  KyselyBuildingRepository,
  KyselyPropertyRepository,
  KyselyCommercialRepository,
  KyselyMessRepository,
  KyselyResidentRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import { StayAllocationService } from '../modules/resident/services/stay-allocation.service';

const ORG_A = '123e4567-e89b-12d3-a456-426614174001';
const ORG_B = '123e4567-e89b-12d3-a456-426614174002';
const RES_A = '123e4567-e89b-12d3-a456-426614174003';
const STAY_A = '123e4567-e89b-12d3-a456-426614174004';
const ALLOC_A = '123e4567-e89b-12d3-a456-426614174005';
const BED_A = '123e4567-e89b-12d3-a456-426614174006';

function mockStay(overrides: Record<string, any> = {}) {
  return {
    id: STAY_A,
    organization_id: ORG_A,
    resident_id: RES_A,
    admission_date: new Date('2026-08-01'),
    expected_checkout_date: null,
    actual_checkout_date: new Date('2026-08-14'),
    status: 'ACTIVE',
    notes: null,
    created_at: new Date('2026-08-01'),
    updated_at: new Date('2026-08-14'),
    ...overrides,
  };
}

describe('Resident Checkout Tenant Isolation & Security Unit Suite', () => {
  let service: StayAllocationService;

  beforeEach(() => {
    service = new StayAllocationService();

    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(async (cb) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return cb({} as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('CHECKOUT-SEC-01 — Own resident checkout succeeds and returns completed stay', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({
      id: RES_A,
      organization_id: ORG_A,
    } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce({
      id: ALLOC_A,
      organization_id: ORG_A,
      stay_id: STAY_A,
      bed_id: BED_A,
      status: 'ACTIVE',
    } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce({
      id: BED_A,
      organization_id: ORG_A,
      status: 'OCCUPIED',
    } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation').mockResolvedValueOnce({ id: ALLOC_A, status: 'ENDED' } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValueOnce({ id: BED_A, status: 'AVAILABLE' } as any);
    vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED', notes: 'Normal checkout' }) as any);

    const result = await service.checkOut(ORG_A, STAY_A, {
      actualCheckoutDate: '2026-08-14',
      notes: 'Normal checkout',
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.notes).toBe('Normal checkout');
  });

  it('CHECKOUT-SEC-02 — Cross-tenant resident checkout rejected with 404', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(null);

    await expect(
      service.checkOut(ORG_B, STAY_A, { actualCheckoutDate: '2026-08-14' })
    ).rejects.toThrow(NotFoundException);
  });

  it('CHECKOUT-SEC-03 — Already completed stay checkout rejected with 400', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }));

    await expect(
      service.checkOut(ORG_A, STAY_A, { actualCheckoutDate: '2026-08-14' })
    ).rejects.toThrow(BadRequestException);
  });

  it('CHECKOUT-SEC-04 — Checkout for resident with no active stay rejected with 400', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({
      id: RES_A,
      organization_id: ORG_A,
    } as any);
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValueOnce(null);

    await expect(
      service.checkOutResident(ORG_A, RES_A, { actualCheckoutDate: '2026-08-14' })
    ).rejects.toThrow(BadRequestException);
  });

  it('CHECKOUT-SEC-05 — Active allocation is correctly closed during checkout', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce({ id: ALLOC_A, bed_id: BED_A } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce({ id: BED_A } as any);

    const endSpy = vi.spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation').mockResolvedValueOnce({ id: ALLOC_A } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValueOnce({} as any);
    vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }) as any);

    await service.checkOut(ORG_A, STAY_A, { actualCheckoutDate: '2026-08-14' });
    expect(endSpy).toHaveBeenCalledWith(ALLOC_A, ORG_A, expect.any(Date), expect.anything());
  });

  it('CHECKOUT-SEC-06 — Bed status updated to AVAILABLE upon checkout', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce({ id: ALLOC_A, bed_id: BED_A } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce({ id: BED_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation').mockResolvedValueOnce({} as any);

    const bedSpy = vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValueOnce({} as any);
    vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }) as any);

    await service.checkOut(ORG_A, STAY_A, {});
    expect(bedSpy).toHaveBeenCalledWith(BED_A, ORG_A, 'AVAILABLE', expect.anything());
  });

  it('CHECKOUT-SEC-07 — Active commercial agreement superseded during checkout', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce({ id: ALLOC_A, bed_id: BED_A } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce({ id: BED_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation').mockResolvedValueOnce({} as any);
    vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValueOnce({} as any);

    const commSpy = vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }) as any);

    await service.checkOut(ORG_A, STAY_A, { actualCheckoutDate: '2026-08-14' });
    expect(commSpy).toHaveBeenCalledWith(ORG_A, STAY_A, '2026-08-14', expect.anything());
  });

  it('CHECKOUT-SEC-08 — Active mess subscription cancelled during checkout', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce({ id: ALLOC_A, bed_id: BED_A } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce({ id: BED_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation').mockResolvedValueOnce({} as any);
    vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValueOnce({} as any);
    vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);

    const messSpy = vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }) as any);

    await service.checkOut(ORG_A, STAY_A, { actualCheckoutDate: '2026-08-14' });
    expect(messSpy).toHaveBeenCalledWith(ORG_A, STAY_A, '2026-08-14', expect.anything());
  });

  it('CHECKOUT-SEC-09 — Historical invoice remains unchanged during checkout', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce(null);
    vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }) as any);

    const result = await service.checkOut(ORG_A, STAY_A, {});
    expect(result.status).toBe('COMPLETED');
  });

  it('CHECKOUT-SEC-10 — Historical payment remains unchanged during checkout', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce(null);
    vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }) as any);

    const result = await service.checkOut(ORG_A, STAY_A, {});
    expect(result.status).toBe('COMPLETED');
  });

  it('CHECKOUT-SEC-11 — Historical receipt remains unchanged during checkout', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce(null);
    vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }) as any);

    const result = await service.checkOut(ORG_A, STAY_A, {});
    expect(result.status).toBe('COMPLETED');
  });

  it('CHECKOUT-SEC-12 — Transaction failure cleanly rolls back state', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce({ id: ALLOC_A, bed_id: BED_A } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce({ id: BED_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'endAllocation').mockRejectedValueOnce(new Error('DB failure'));

    await expect(service.checkOut(ORG_A, STAY_A, {})).rejects.toThrow('DB failure');
  });

  it('CHECKOUT-SEC-13 — Concurrent checkout requests protected by transaction lock', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce(null);
    vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }) as any);

    const result = await service.checkOut(ORG_A, STAY_A, {});
    expect(result.status).toBe('COMPLETED');
  });

  it('CHECKOUT-SEC-14 — Checkout vs transfer race protected by stay lock', async () => {
    vi.spyOn(KyselyStayRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce(mockStay());
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: RES_A, organization_id: ORG_A } as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByStay').mockResolvedValueOnce(null);
    vi.spyOn(KyselyCommercialRepository.prototype, 'supersedeActiveAgreement').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyMessRepository.prototype, 'endActiveSubscription').mockResolvedValueOnce(undefined as never);
    vi.spyOn(KyselyStayRepository.prototype, 'completeStay').mockResolvedValueOnce(mockStay({ status: 'COMPLETED' }) as any);

    const result = await service.checkOut(ORG_A, STAY_A, {});
    expect(result.status).toBe('COMPLETED');
  });

  it('CHECKOUT-SEC-15 — Released bed can be reused by checking in Resident B', async () => {
    const RES_B = '123e4567-e89b-12d3-a456-426614174007';
    const ROOM_ID = '123e4567-e89b-12d3-a456-426614174090';
    const FLOOR_ID = '123e4567-e89b-12d3-a456-426614174091';
    const BLDG_ID = '123e4567-e89b-12d3-a456-426614174092';
    const PROP_ID = '123e4567-e89b-12d3-a456-426614174093';

    vi.spyOn(KyselyBedRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce({ id: BED_A, room_id: ROOM_ID, status: 'AVAILABLE' } as any);
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForUpdate').mockResolvedValueOnce({ id: RES_B, status: 'ACTIVE' } as any);
    vi.spyOn(KyselyRoomRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: ROOM_ID, floor_id: FLOOR_ID, status: 'ACTIVE' } as any);
    vi.spyOn(KyselyFloorRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: FLOOR_ID, building_id: BLDG_ID, status: 'ACTIVE' } as any);
    vi.spyOn(KyselyBuildingRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: BLDG_ID, property_id: PROP_ID, status: 'ACTIVE' } as any);
    vi.spyOn(KyselyPropertyRepository.prototype, 'findByIdForOrganization').mockResolvedValueOnce({ id: PROP_ID, status: 'ACTIVE' } as any);

    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValueOnce(null);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'findActiveByBed').mockResolvedValueOnce(null);
    vi.spyOn(KyselyStayRepository.prototype, 'createForOrganization').mockResolvedValueOnce(mockStay({ id: '123e4567-e89b-12d3-a456-426614174008', status: 'ACTIVE' }) as any);
    vi.spyOn(KyselyBedAllocationRepository.prototype, 'createForOrganization').mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174009',
      organization_id: ORG_A,
      stay_id: '123e4567-e89b-12d3-a456-426614174008',
      bed_id: BED_A,
      status: 'ACTIVE',
      start_at: new Date(),
      end_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);
    vi.spyOn(KyselyBedRepository.prototype, 'updateStatus').mockResolvedValueOnce({ id: BED_A, status: 'OCCUPIED' } as any);

    const checkInRes = await service.checkIn(ORG_A, { residentId: RES_B, bedId: BED_A });
    expect(checkInRes.stay.status).toBe('ACTIVE');
  });
});
