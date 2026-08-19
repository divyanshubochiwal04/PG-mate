import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyMessRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type {
  MessConfigurationRow,
  MessExpenseCategory,
  MessRow,
  ResidentMessSubscriptionRow,
} from '@m-square/database';
import type {
  MealConsumptionDto,
  MealPlanDto,
  MealTypeDto,
  MenuDto,
  MessConfigDto,
  MessDto,
  MessExpenseDto,
  MessInventoryItemDto,
  MessInventoryTransactionDto,
  MessProcurementDto,
  MessSubscriptionDto,
  MessTodayMetricsDto,
  MessVendorDto,
  UpdateMessConfigDto,
} from '@m-square/contracts';
import { MessInventoryService } from './mess-inventory.service';
import { MessSubscriptionService } from './mess-subscription.service';
import { mapConfigRow, mapMessRow, mapSubscriptionRow } from './mess-mappers';

@Injectable()
export class MessService {
  private readonly db = dbService.db;
  private readonly messRepo = new KyselyMessRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);
  private readonly messInventoryService = new MessInventoryService(this.messRepo, this.unitOfWork);
  private readonly messSubscriptionService = new MessSubscriptionService();

  public async getConfig(organizationId: string): Promise<MessConfigDto> {
    const row = await this.messRepo.getConfig(organizationId);
    if (!row) {
      const created = await this.messRepo.upsertConfig(organizationId, {});
      return mapConfigRow(created);
    }
    return mapConfigRow(row);
  }

  public async updateConfig(
    organizationId: string,
    dto: UpdateMessConfigDto
  ): Promise<MessConfigDto> {
    const row = await this.messRepo.upsertConfig(organizationId, dto);
    return mapConfigRow(row);
  }

  public async listMesses(organizationId: string): Promise<MessDto[]> {
    const rows = await this.messRepo.listMesses(organizationId);
    return rows.map(mapMessRow);
  }

  public async createMess(
    organizationId: string,
    dto: { name: string; code: string; scopeType?: 'CENTRAL' | 'PER_BLOCK'; buildingIds?: string[] }
  ): Promise<MessDto> {
    const row = await this.messRepo.createMess({
      organization_id: organizationId,
      name: dto.name,
      code: dto.code,
      scope_type: dto.scopeType || 'CENTRAL',
      is_active: true,
    });
    if (dto.buildingIds && dto.buildingIds.length > 0) {
      await this.messRepo.assignBuildings(organizationId, row.id, dto.buildingIds);
    }
    return mapMessRow(row);
  }

  public async assignMessBuildings(
    organizationId: string,
    messId: string,
    buildingIds: string[]
  ): Promise<void> {
    const mess = await this.messRepo.findMessById(messId, organizationId);
    if (!mess) throw new NotFoundException('Mess not found');
    await this.messRepo.assignBuildings(organizationId, messId, buildingIds);
  }

  public async listMealTypes(organizationId: string, messId: string): Promise<MealTypeDto[]> {
    const rows = await this.messRepo.listMealTypes(organizationId, messId);
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      messId: r.mess_id,
      name: r.name,
      startTime: r.start_time,
      endTime: r.end_time,
      displayOrder: r.display_order,
      isActive: r.is_active,
    }));
  }

  public async createMealType(
    organizationId: string,
    dto: { messId: string; name: string; startTime: string; endTime: string; displayOrder?: number }
  ): Promise<MealTypeDto> {
    const created = await this.messRepo.createMealType({
      organization_id: organizationId,
      mess_id: dto.messId,
      name: dto.name,
      start_time: dto.startTime,
      end_time: dto.endTime,
      display_order: dto.displayOrder || 0,
      is_active: true,
    });
    return {
      id: created.id,
      organizationId: created.organization_id,
      messId: created.mess_id,
      name: created.name,
      startTime: created.start_time,
      endTime: created.end_time,
      displayOrder: created.display_order,
      isActive: created.is_active,
    };
  }

  public async listMealPlans(organizationId: string, messId: string): Promise<MealPlanDto[]> {
    const rows = await this.messRepo.listMealPlans(organizationId, messId);
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      messId: r.mess_id,
      name: r.name,
      description: r.description,
      billingMode: r.billing_mode,
      price: Number(r.price),
      includedMealTypes: r.included_meal_types,
      version: r.version,
      isActive: r.is_active,
    }));
  }

  public async createMealPlan(
    organizationId: string,
    dto: {
      messId: string;
      name: string;
      description?: string;
      billingMode: 'PER_MEAL' | 'MONTHLY';
      price: number;
      includedMealTypes?: string;
    }
  ): Promise<MealPlanDto> {
    const created = await this.messRepo.createMealPlan({
      organization_id: organizationId,
      mess_id: dto.messId,
      name: dto.name,
      description: dto.description || null,
      billing_mode: dto.billingMode,
      price: dto.price,
      included_meal_types: dto.includedMealTypes || 'ALL',
      version: 1,
      is_active: true,
    });
    return {
      id: created.id,
      organizationId: created.organization_id,
      messId: created.mess_id,
      name: created.name,
      description: created.description,
      billingMode: created.billing_mode,
      price: Number(created.price),
      includedMealTypes: created.included_meal_types,
      version: created.version,
      isActive: created.is_active,
    };
  }

  public async findMenuByDate(
    organizationId: string,
    messId: string,
    date: string,
    mealTypeId: string
  ): Promise<MenuDto | null> {
    const res = await this.messRepo.findMenuByDate(organizationId, messId, date, mealTypeId);
    if (!res) return null;
    return {
      id: res.id,
      organizationId: res.organization_id,
      messId: res.mess_id,
      menuDate: res.menu_date,
      mealTypeId: res.meal_type_id,
      notes: res.notes,
      items: res.items.map((i) => ({
        id: i.id,
        itemName: i.item_name,
        category: i.category,
        displayOrder: i.display_order,
      })),
    };
  }

  public async upsertMenu(
    organizationId: string,
    dto: {
      messId: string;
      menuDate: string;
      mealTypeId: string;
      notes?: string;
      items: { itemName: string; category?: string; displayOrder?: number }[];
    }
  ): Promise<MenuDto> {
    const menuRow = await this.messRepo.upsertMenu(
      organizationId,
      {
        organization_id: organizationId,
        mess_id: dto.messId,
        menu_date: dto.menuDate,
        meal_type_id: dto.mealTypeId,
        notes: dto.notes || null,
      },
      dto.items.map((i) => ({
        item_name: i.itemName,
        category: i.category || 'MAIN_COURSE',
        display_order: i.displayOrder || 0,
      }))
    );
    const fullMenu = await this.findMenuByDate(
      organizationId,
      dto.messId,
      dto.menuDate,
      dto.mealTypeId
    );
    return (
      fullMenu || {
        id: menuRow.id,
        organizationId: menuRow.organization_id,
        messId: menuRow.mess_id,
        menuDate: menuRow.menu_date,
        mealTypeId: menuRow.meal_type_id,
        notes: menuRow.notes,
        items: [],
      }
    );
  }

  public async findActiveSubscriptionByStay(
    organizationId: string,
    stayId: string
  ): Promise<MessSubscriptionDto | null> {
    const row = await this.messRepo.findActiveSubscriptionByStay(organizationId, stayId);
    return row ? mapSubscriptionRow(row) : null;
  }

  public async createSubscription(
    organizationId: string,
    dto: {
      residentId: string;
      stayId: string;
      messId: string;
      mealPlanId: string;
      billingMode: 'PER_MEAL' | 'MONTHLY';
      priceAtSubscription: number;
      startDate?: string;
    }
  ): Promise<MessSubscriptionDto> {
    const created = await this.messRepo.createSubscription({
      organization_id: organizationId,
      resident_id: dto.residentId,
      stay_id: dto.stayId,
      mess_id: dto.messId,
      meal_plan_id: dto.mealPlanId,
      billing_mode: dto.billingMode,
      price_at_subscription: dto.priceAtSubscription,
      status: 'ACTIVE',
      start_date: dto.startDate || new Date().toISOString().split('T')[0],
      end_date: null,
    });
    return mapSubscriptionRow(created);
  }

  public async getResidentMessSubscription(
    organizationId: string,
    residentId: string
  ): Promise<MessSubscriptionDto | null> {
    return this.messSubscriptionService.getResidentMessSubscription(organizationId, residentId);
  }

  public async createResidentMessSubscription(
    organizationId: string,
    residentId: string,
    dto: { messId: string; mealPlanId: string; startDate?: string; notes?: string }
  ): Promise<MessSubscriptionDto> {
    return this.messSubscriptionService.createResidentMessSubscription(organizationId, residentId, dto);
  }

  public async changeResidentMessSubscription(
    organizationId: string,
    residentId: string,
    dto: { messId: string; mealPlanId: string; startDate?: string }
  ): Promise<MessSubscriptionDto> {
    return this.messSubscriptionService.changeResidentMessSubscription(organizationId, residentId, dto);
  }

  public async cancelResidentMessSubscription(
    organizationId: string,
    residentId: string,
    dto: { cancellationDate?: string; reason?: string }
  ): Promise<MessSubscriptionDto> {
    return this.messSubscriptionService.cancelResidentMessSubscription(organizationId, residentId, dto);
  }

  public async recordConsumption(
    organizationId: string,
    dto: {
      subscriptionId: string;
      residentId: string;
      stayId: string;
      messId: string;
      mealTypeId: string;
      consumptionDate?: string;
      status?: 'CONSUMED' | 'SKIPPED' | 'CANCELLED';
      notes?: string;
    }
  ): Promise<MealConsumptionDto> {
    const sub = await this.messRepo.findSubscriptionById(organizationId, dto.subscriptionId);
    if (!sub || sub.organization_id !== organizationId) {
      throw new NotFoundException('Mess subscription not found');
    }
    if (sub.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Cannot record meal consumption for an inactive or cancelled subscription'
      );
    }
    if (
      sub.resident_id !== dto.residentId ||
      sub.stay_id !== dto.stayId ||
      sub.mess_id !== dto.messId
    ) {
      throw new BadRequestException('Subscription metadata mismatch');
    }
    const created = await this.messRepo.recordConsumption({
      organization_id: organizationId,
      subscription_id: dto.subscriptionId,
      resident_id: dto.residentId,
      stay_id: dto.stayId,
      mess_id: dto.messId,
      meal_type_id: dto.mealTypeId,
      consumption_date: dto.consumptionDate || new Date().toISOString().split('T')[0],
      status: dto.status || 'CONSUMED',
      notes: dto.notes || null,
    });
    return {
      id: created.id,
      organizationId: created.organization_id,
      subscriptionId: created.subscription_id,
      residentId: created.resident_id,
      stayId: created.stay_id,
      messId: created.mess_id,
      mealTypeId: created.meal_type_id,
      consumptionDate: created.consumption_date,
      status: created.status,
      notes: created.notes,
      createdAt: created.created_at
        ? new Date(created.created_at).toISOString()
        : new Date().toISOString(),
    };
  }

  public async getTodayMetrics(
    organizationId: string,
    messId: string,
    date: string
  ): Promise<MessTodayMetricsDto> {
    const metrics = await this.messRepo.getTodayConsumptionMetrics(organizationId, messId, date);
    return { ...metrics, date };
  }

  public async adjustInventory(
    organizationId: string,
    dto: {
      messId: string;
      inventoryItemId: string;
      transactionType:
        | 'OPENING_STOCK'
        | 'PURCHASE'
        | 'ADJUSTMENT_IN'
        | 'ADJUSTMENT_OUT'
        | 'CONSUMPTION'
        | 'WASTAGE';
      quantity: number;
      notes?: string;
    }
  ): Promise<MessInventoryTransactionDto> {
    return this.messInventoryService.recordInventoryAdjustment(organizationId, dto);
  }

  public async listInventoryItems(
    organizationId: string,
    messId: string,
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      category?: string;
      status?: MessInventoryItemDto['status'];
    }
  ): Promise<{ items: MessInventoryItemDto[]; total: number }> {
    return this.messInventoryService.listInventoryItems(
      organizationId,
      messId,
      page,
      pageSize,
      options
    );
  }

  public async getInventoryItemById(
    organizationId: string,
    id: string
  ): Promise<MessInventoryItemDto> {
    return this.messInventoryService.getInventoryItemById(organizationId, id);
  }

  public async createInventoryItem(
    organizationId: string,
    dto: {
      messId: string;
      name: string;
      category?: string;
      unit: string;
      currentStock?: number;
      minimumStock?: number;
      reorderLevel?: number;
    }
  ): Promise<MessInventoryItemDto> {
    return this.messInventoryService.createInventoryItem(organizationId, dto);
  }

  public async updateInventoryItem(
    organizationId: string,
    id: string,
    dto: {
      name?: string;
      category?: string;
      unit?: string;
      minimumStock?: number;
      reorderLevel?: number;
      status?: MessInventoryItemDto['status'];
    }
  ): Promise<MessInventoryItemDto> {
    return this.messInventoryService.updateInventoryItem(organizationId, id, dto);
  }

  public async getInventoryStockLedger(
    organizationId: string,
    inventoryItemId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ items: MessInventoryTransactionDto[]; total: number }> {
    return this.messInventoryService.getInventoryStockLedger(
      organizationId,
      inventoryItemId,
      page,
      pageSize
    );
  }

  public async listVendors(
    organizationId: string,
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      status?: MessVendorDto['status'];
    }
  ): Promise<{ items: MessVendorDto[]; total: number }> {
    return this.messInventoryService.listVendors(organizationId, page, pageSize, options);
  }

  public async getVendorById(organizationId: string, id: string): Promise<MessVendorDto> {
    return this.messInventoryService.getVendorById(organizationId, id);
  }

  public async createVendor(
    organizationId: string,
    dto: { name: string; phone?: string; email?: string; address?: string; notes?: string }
  ): Promise<MessVendorDto> {
    return this.messInventoryService.createVendor(organizationId, dto);
  }

  public async updateVendor(
    organizationId: string,
    id: string,
    dto: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      status?: MessVendorDto['status'];
      notes?: string;
    }
  ): Promise<MessVendorDto> {
    return this.messInventoryService.updateVendor(organizationId, id, dto);
  }

  public async listProcurements(
    organizationId: string,
    messId: string,
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      vendorId?: string;
    }
  ): Promise<{ items: MessProcurementDto[]; total: number }> {
    return this.messInventoryService.listProcurements(
      organizationId,
      messId,
      page,
      pageSize,
      options
    );
  }

  public async getProcurementById(
    organizationId: string,
    id: string
  ): Promise<MessProcurementDto> {
    return this.messInventoryService.getProcurementById(organizationId, id);
  }

  public async createProcurement(
    organizationId: string,
    dto: {
      messId: string;
      vendorId: string;
      purchaseDate?: string;
      invoiceReference?: string;
      notes?: string;
      items: { inventoryItemId: string; quantity: number; unitPrice: number }[];
    }
  ): Promise<MessProcurementDto> {
    return this.messInventoryService.createProcurement(organizationId, dto);
  }

  public async listExpenses(
    organizationId: string,
    messId: string,
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      category?: MessExpenseCategory;
      vendorId?: string;
    }
  ): Promise<{ items: MessExpenseDto[]; total: number }> {
    return this.messInventoryService.listExpenses(
      organizationId,
      messId,
      page,
      pageSize,
      options
    );
  }

  public async getExpenseById(organizationId: string, id: string): Promise<MessExpenseDto> {
    return this.messInventoryService.getExpenseById(organizationId, id);
  }

  public async createExpense(
    organizationId: string,
    dto: {
      messId: string;
      category: MessExpenseCategory;
      amount: number;
      expenseDate?: string;
      vendorId?: string;
      referenceNo?: string;
      notes?: string;
    }
  ): Promise<MessExpenseDto> {
    return this.messInventoryService.createExpense(organizationId, dto);
  }
}
