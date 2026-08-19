import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import {
  KyselyMessRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import { MessService } from '../modules/mess/mess.service';

const ORG_A = '123e4567-e89b-12d3-a456-426614174001';
const ORG_B = '123e4567-e89b-12d3-a456-426614174002';
const RES_A = '123e4567-e89b-12d3-a456-426614174003';
const RES_B = '123e4567-e89b-12d3-a456-426614174004';
const STAY_A = '123e4567-e89b-12d3-a456-426614174005';
const MESS_A = '123e4567-e89b-12d3-a456-426614174006';
const MESS_B = '123e4567-e89b-12d3-a456-426614174007';
const PLAN_A = '123e4567-e89b-12d3-a456-426614174008';
const PLAN_B = '123e4567-e89b-12d3-a456-426614174009';
const SUB_A = '123e4567-e89b-12d3-a456-426614174010';

describe('apps/api — M13D Resident Mess Subscription Tenant Security & Lifecycle Suite', () => {
  let messService: MessService;

  beforeEach(() => {
    messService = new MessService();

    vi.spyOn(KyselyUnitOfWork.prototype, 'runInTransaction').mockImplementation(async (cb) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return cb({} as any);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('MSU1 — Own subscription GET succeeds', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };
    const mockStay = { id: STAY_A, resident_id: RES_A, organization_id: ORG_A, status: 'ACTIVE' };
    const mockSub = {
      id: SUB_A,
      organization_id: ORG_A,
      resident_id: RES_A,
      stay_id: STAY_A,
      mess_id: MESS_A,
      meal_plan_id: PLAN_A,
      billing_mode: 'MONTHLY' as const,
      price_at_subscription: 4500,
      status: 'ACTIVE' as const,
      start_date: '2026-08-01',
      end_date: null,
    };

    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      mockStay as any
    );
    vi.spyOn(KyselyMessRepository.prototype, 'findActiveSubscriptionByStay').mockResolvedValue(
      mockSub as any
    );
    vi.spyOn(KyselyMessRepository.prototype, 'findMessById').mockResolvedValue({
      id: MESS_A,
      name: 'Central Mess',
    } as any);
    vi.spyOn(KyselyMessRepository.prototype, 'findMealPlanById').mockResolvedValue({
      id: PLAN_A,
      name: 'Standard Monthly',
    } as any);

    const sub = await messService.getResidentMessSubscription(ORG_A, RES_A);
    expect(sub).not.toBeNull();
    expect(sub?.priceAtSubscription).toBe(4500);
    expect(sub?.messName).toBe('Central Mess');
  });

  it('MSU2 — Cross-tenant GET returns 404', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(messService.getResidentMessSubscription(ORG_B, RES_A)).rejects.toThrow(
      NotFoundException
    );
  });

  it('MSU3 — Own subscription creation succeeds', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };
    const mockStay = { id: STAY_A, resident_id: RES_A, organization_id: ORG_A, status: 'ACTIVE' };
    const mockMess = {
      id: MESS_A,
      organization_id: ORG_A,
      name: 'Central Dining',
      is_active: true,
    };
    const mockPlan = {
      id: PLAN_A,
      organization_id: ORG_A,
      mess_id: MESS_A,
      name: 'Standard',
      billing_mode: 'MONTHLY',
      price: 4500,
    };
    const mockCreatedSub = {
      id: SUB_A,
      organization_id: ORG_A,
      resident_id: RES_A,
      stay_id: STAY_A,
      mess_id: MESS_A,
      meal_plan_id: PLAN_A,
      billing_mode: 'MONTHLY' as const,
      price_at_subscription: 4500,
      status: 'ACTIVE' as const,
      start_date: '2026-08-01',
      end_date: null,
    };

    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      mockStay as any
    );
    vi.spyOn(KyselyMessRepository.prototype, 'findMessById').mockResolvedValue(mockMess as any);
    vi.spyOn(KyselyMessRepository.prototype, 'findMealPlanById').mockResolvedValue(mockPlan as any);
    vi.spyOn(KyselyMessRepository.prototype, 'findActiveSubscriptionByStay').mockResolvedValue(
      null
    );
    vi.spyOn(KyselyMessRepository.prototype, 'createSubscription').mockResolvedValue(
      mockCreatedSub as any
    );

    const sub = await messService.createResidentMessSubscription(ORG_A, RES_A, {
      messId: MESS_A,
      mealPlanId: PLAN_A,
      startDate: '2026-08-01',
    });

    expect(sub.id).toBe(SUB_A);
    expect(sub.priceAtSubscription).toBe(4500);
  });

  it('MSU4 — Cross-tenant resident creation rejected (404)', async () => {
    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(null);

    await expect(
      messService.createResidentMessSubscription(ORG_B, RES_A, {
        messId: MESS_A,
        mealPlanId: PLAN_A,
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('MSU5 — Cross-tenant mess facility rejected (404)', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };
    const mockStay = { id: STAY_A, resident_id: RES_A, organization_id: ORG_A, status: 'ACTIVE' };

    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      mockStay as any
    );
    vi.spyOn(KyselyMessRepository.prototype, 'findMessById').mockResolvedValue(null); // Mess missing for Org B

    await expect(
      messService.createResidentMessSubscription(ORG_A, RES_A, {
        messId: MESS_B,
        mealPlanId: PLAN_A,
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('MSU6 — Cross-tenant meal plan rejected (404)', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };
    const mockStay = { id: STAY_A, resident_id: RES_A, organization_id: ORG_A, status: 'ACTIVE' };
    const mockMess = { id: MESS_A, organization_id: ORG_A, name: 'Central' };

    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      mockStay as any
    );
    vi.spyOn(KyselyMessRepository.prototype, 'findMessById').mockResolvedValue(mockMess as any);
    vi.spyOn(KyselyMessRepository.prototype, 'findMealPlanById').mockResolvedValue(null); // Plan missing for Org B

    await expect(
      messService.createResidentMessSubscription(ORG_A, RES_A, {
        messId: MESS_A,
        mealPlanId: PLAN_B,
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('MSU7 — Meal plan from different mess rejected with BadRequestException (400)', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };
    const mockStay = { id: STAY_A, resident_id: RES_A, organization_id: ORG_A, status: 'ACTIVE' };
    const mockMess = { id: MESS_A, organization_id: ORG_A, name: 'Central' };
    const mockPlanOtherMess = {
      id: PLAN_B,
      organization_id: ORG_A,
      mess_id: MESS_B,
      name: 'North Plan',
    };

    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      mockStay as any
    );
    vi.spyOn(KyselyMessRepository.prototype, 'findMessById').mockResolvedValue(mockMess as any);
    vi.spyOn(KyselyMessRepository.prototype, 'findMealPlanById').mockResolvedValue(
      mockPlanOtherMess as any
    );

    await expect(
      messService.createResidentMessSubscription(ORG_A, RES_A, {
        messId: MESS_A,
        mealPlanId: PLAN_B,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('MSU8 — Duplicate ACTIVE subscription rejected with ConflictException (409)', async () => {
    const mockResident = { id: RES_A, organization_id: ORG_A };
    const mockStay = { id: STAY_A, resident_id: RES_A, organization_id: ORG_A, status: 'ACTIVE' };
    const mockMess = { id: MESS_A, organization_id: ORG_A, name: 'Central' };
    const mockPlan = { id: PLAN_A, organization_id: ORG_A, mess_id: MESS_A, name: 'Standard' };
    const mockExistingSub = { id: SUB_A, status: 'ACTIVE' };

    vi.spyOn(KyselyResidentRepository.prototype, 'findByIdForOrganization').mockResolvedValue(
      mockResident as any
    );
    vi.spyOn(KyselyStayRepository.prototype, 'findActiveByResident').mockResolvedValue(
      mockStay as any
    );
    vi.spyOn(KyselyMessRepository.prototype, 'findMessById').mockResolvedValue(mockMess as any);
    vi.spyOn(KyselyMessRepository.prototype, 'findMealPlanById').mockResolvedValue(mockPlan as any);
    vi.spyOn(KyselyMessRepository.prototype, 'findActiveSubscriptionByStay').mockResolvedValue(
      mockExistingSub as any
    );

    await expect(
      messService.createResidentMessSubscription(ORG_A, RES_A, {
        messId: MESS_A,
        mealPlanId: PLAN_A,
      })
    ).rejects.toThrow(ConflictException);
  });

  it('MSU9 — Cancelled subscription cannot be used for meal consumption (400)', async () => {
    const mockCancelledSub = {
      id: SUB_A,
      organization_id: ORG_A,
      resident_id: RES_A,
      stay_id: STAY_A,
      mess_id: MESS_A,
      status: 'CANCELLED',
    };

    vi.spyOn(KyselyMessRepository.prototype, 'findSubscriptionById').mockResolvedValue(
      mockCancelledSub as any
    );

    await expect(
      messService.recordConsumption(ORG_A, {
        subscriptionId: SUB_A,
        residentId: RES_A,
        stayId: STAY_A,
        messId: MESS_A,
        mealTypeId: 'meal-type-1',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('MSU10 — Missing subscription blocks consumption with NotFoundException (404)', async () => {
    vi.spyOn(KyselyMessRepository.prototype, 'findSubscriptionById').mockResolvedValue(null);

    await expect(
      messService.recordConsumption(ORG_A, {
        subscriptionId: SUB_A,
        residentId: RES_A,
        stayId: STAY_A,
        messId: MESS_A,
        mealTypeId: 'meal-type-1',
      })
    ).rejects.toThrow(NotFoundException);
  });
});
