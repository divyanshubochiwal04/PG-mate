import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyMessRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { ResidentMessSubscriptionRow } from '@m-square/database';
import type { MessSubscriptionDto } from '@m-square/contracts';

@Injectable()
export class MessSubscriptionService {
  private readonly db = dbService.db;
  private readonly messRepo = new KyselyMessRepository(this.db);
  private readonly residentRepo = new KyselyResidentRepository(this.db);
  private readonly stayRepo = new KyselyStayRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);

  public async getResidentMessSubscription(
    organizationId: string,
    residentId: string
  ): Promise<MessSubscriptionDto | null> {
    const resident = await this.residentRepo.findByIdForOrganization(residentId, organizationId);
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    const stay = await this.stayRepo.findActiveByResident(organizationId, residentId);
    if (!stay) {
      return null;
    }
    const sub = await this.messRepo.findActiveSubscriptionByStay(organizationId, stay.id);
    if (!sub) {
      return null;
    }
    const mess = await this.messRepo.findMessById(sub.mess_id, organizationId);
    const plan = await this.messRepo.findMealPlanById(sub.meal_plan_id, organizationId);

    return this.mapSubscriptionRow(sub, {
      messName: mess?.name,
      mealPlanName: plan?.name,
    });
  }

  public async createResidentMessSubscription(
    organizationId: string,
    residentId: string,
    dto: { messId: string; mealPlanId: string; startDate?: string; notes?: string }
  ): Promise<MessSubscriptionDto> {
    const resident = await this.residentRepo.findByIdForOrganization(residentId, organizationId);
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    const stay = await this.stayRepo.findActiveByResident(organizationId, residentId);
    if (!stay) {
      throw new BadRequestException('Resident has no active stay to subscribe to mess');
    }

    const mess = await this.messRepo.findMessById(dto.messId, organizationId);
    if (!mess) {
      throw new NotFoundException('Mess facility not found');
    }

    const plan = await this.messRepo.findMealPlanById(dto.mealPlanId, organizationId);
    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }
    if (plan.mess_id !== dto.messId) {
      throw new BadRequestException('Meal plan does not belong to selected mess');
    }

    const existingSub = await this.messRepo.findActiveSubscriptionByStay(organizationId, stay.id);
    if (existingSub) {
      throw new ConflictException('Resident already has an active mess subscription for this stay');
    }

    const created = await this.messRepo.createSubscription({
      organization_id: organizationId,
      resident_id: residentId,
      stay_id: stay.id,
      mess_id: dto.messId,
      meal_plan_id: dto.mealPlanId,
      billing_mode: plan.billing_mode,
      price_at_subscription: Number(plan.price),
      status: 'ACTIVE',
      start_date: dto.startDate || new Date().toISOString().split('T')[0],
      end_date: null,
    });

    return this.mapSubscriptionRow(created, {
      messName: mess.name,
      mealPlanName: plan.name,
    });
  }

  public async changeResidentMessSubscription(
    organizationId: string,
    residentId: string,
    dto: { messId: string; mealPlanId: string; startDate?: string }
  ): Promise<MessSubscriptionDto> {
    const resident = await this.residentRepo.findByIdForOrganization(residentId, organizationId);
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    const stay = await this.stayRepo.findActiveByResident(organizationId, residentId);
    if (!stay) {
      throw new BadRequestException('Resident has no active stay');
    }

    const mess = await this.messRepo.findMessById(dto.messId, organizationId);
    if (!mess) {
      throw new NotFoundException('Mess facility not found');
    }

    const plan = await this.messRepo.findMealPlanById(dto.mealPlanId, organizationId);
    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }
    if (plan.mess_id !== dto.messId) {
      throw new BadRequestException('Meal plan does not belong to selected mess');
    }

    const currentSub = await this.messRepo.findActiveSubscriptionByStay(organizationId, stay.id);
    if (!currentSub) {
      throw new NotFoundException('No active mess subscription found to change');
    }

    const effectiveDate = dto.startDate || new Date().toISOString().split('T')[0];

    const newSub = await this.unitOfWork.runInTransaction(async (trx) => {
      await this.messRepo.supersedeActiveSubscription(organizationId, stay.id, effectiveDate, trx);
      return this.messRepo.createSubscription(
        {
          organization_id: organizationId,
          resident_id: residentId,
          stay_id: stay.id,
          mess_id: dto.messId,
          meal_plan_id: dto.mealPlanId,
          billing_mode: plan.billing_mode,
          price_at_subscription: Number(plan.price),
          status: 'ACTIVE',
          start_date: effectiveDate,
          end_date: null,
        },
        trx
      );
    });

    return this.mapSubscriptionRow(newSub, {
      messName: mess.name,
      mealPlanName: plan.name,
    });
  }

  public async cancelResidentMessSubscription(
    organizationId: string,
    residentId: string,
    dto: { cancellationDate?: string; reason?: string }
  ): Promise<MessSubscriptionDto> {
    const resident = await this.residentRepo.findByIdForOrganization(residentId, organizationId);
    if (!resident) {
      throw new NotFoundException('Resident not found');
    }
    const stay = await this.stayRepo.findActiveByResident(organizationId, residentId);
    if (!stay) {
      throw new BadRequestException('Resident has no active stay');
    }

    const currentSub = await this.messRepo.findActiveSubscriptionByStay(organizationId, stay.id);
    if (!currentSub) {
      throw new NotFoundException('No active mess subscription found to cancel');
    }

    const effectiveDate = dto.cancellationDate || new Date().toISOString().split('T')[0];

    await this.unitOfWork.runInTransaction(async (trx) => {
      await this.messRepo.cancelActiveSubscription(organizationId, stay.id, effectiveDate, trx);
    });

    const updatedSub = await this.messRepo.findSubscriptionById(organizationId, currentSub.id);
    if (!updatedSub) {
      throw new NotFoundException('Cancelled subscription record lost');
    }

    return this.mapSubscriptionRow(updatedSub);
  }

  public mapSubscriptionRow(
    r: ResidentMessSubscriptionRow,
    extra?: { messName?: string; mealPlanName?: string }
  ): MessSubscriptionDto {
    return {
      id: r.id,
      organizationId: r.organization_id,
      residentId: r.resident_id,
      stayId: r.stay_id,
      messId: r.mess_id,
      mealPlanId: r.meal_plan_id,
      billingMode: r.billing_mode,
      priceAtSubscription: Number(r.price_at_subscription),
      status: r.status,
      startDate: r.start_date,
      endDate: r.end_date,
      messName: extra?.messName,
      mealPlanName: extra?.mealPlanName,
    };
  }
}
