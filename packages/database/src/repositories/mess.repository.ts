import { type Kysely, sql, type Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type {
  MessBuildingAssignmentRow,
  MessConfigurationRow,
  MessMealConsumptionRow,
  MessMealPlanRow,
  MessMealTypeRow,
  MessMenuItemRow,
  MessMenuRow,
  MessRow,
  ResidentMessSubscriptionRow,
} from '../schema/mess.schema';

export type { MessRepository } from './mess-repository.interface';
import type { MessRepository } from './mess-repository.interface';

import { KyselyMessInventoryRepository } from './mess-inventory.repository';

export class KyselyMessRepository extends KyselyMessInventoryRepository implements MessRepository {
  constructor(db: Kysely<DatabaseSchema>) {
    super(db);
  }

  protected getExecutor(trx?: Transaction<DatabaseSchema>) {
    return trx && typeof (trx as unknown as Record<string, unknown>).selectFrom === 'function'
      ? trx
      : this.db;
  }

  public async getConfig(
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessConfigurationRow | null> {
    const client = this.getExecutor(trx);
    const row = await client
      .selectFrom('mess_configurations')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async upsertConfig(
    organizationId: string,
    data: {
      isEnabled?: boolean;
      scopeType?: 'CENTRAL' | 'PER_BLOCK';
      billingMode?: 'PER_MEAL' | 'MONTHLY' | 'HYBRID';
    },
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessConfigurationRow> {
    const client = this.getExecutor(trx);
    const existing = await this.getConfig(organizationId, trx);
    if (existing) {
      const updated = await client
        .updateTable('mess_configurations')
        .set({
          is_enabled: data.isEnabled !== undefined ? data.isEnabled : existing.is_enabled,
          scope_type: data.scopeType || existing.scope_type,
          billing_mode: data.billingMode || existing.billing_mode,
          updated_at: sql`NOW()` as never,
        })
        .where('organization_id', '=', organizationId)
        .returningAll()
        .executeTakeFirstOrThrow();
      return updated;
    }
    return client
      .insertInto('mess_configurations')
      .values({
        organization_id: organizationId,
        is_enabled: data.isEnabled !== undefined ? data.isEnabled : true,
        scope_type: data.scopeType || 'CENTRAL',
        billing_mode: data.billingMode || 'MONTHLY',
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async listMesses(
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessRow[]> {
    const client = this.getExecutor(trx);
    return client
      .selectFrom('messes')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .orderBy('created_at', 'asc')
      .execute();
  }

  public async findMessById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessRow | null> {
    const client = this.getExecutor(trx);
    const row = await client
      .selectFrom('messes')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async createMess(
    mess: Omit<MessRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessRow> {
    const client = this.getExecutor(trx);
    return client.insertInto('messes').values(mess).returningAll().executeTakeFirstOrThrow();
  }

  public async assignBuildings(
    organizationId: string,
    messId: string,
    buildingIds: string[],
    trx?: Transaction<DatabaseSchema>
  ): Promise<void> {
    const client = this.getExecutor(trx);
    await client
      .updateTable('mess_building_assignments')
      .set({ is_active: false })
      .where('organization_id', '=', organizationId)
      .where('mess_id', '=', messId)
      .execute();
    for (const bId of buildingIds) {
      await client
        .insertInto('mess_building_assignments')
        .values({
          organization_id: organizationId,
          mess_id: messId,
          building_id: bId,
          is_active: true,
        })
        .execute();
    }
  }

  public async getBuildingAssignments(
    organizationId: string,
    messId: string
  ): Promise<MessBuildingAssignmentRow[]> {
    return this.db
      .selectFrom('mess_building_assignments')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('mess_id', '=', messId)
      .where('is_active', '=', true)
      .execute();
  }

  public async listMealTypes(
    organizationId: string,
    messId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealTypeRow[]> {
    const client = this.getExecutor(trx);
    return client
      .selectFrom('mess_meal_types')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('mess_id', '=', messId)
      .orderBy('display_order', 'asc')
      .execute();
  }

  public async createMealType(
    mealType: Omit<MessMealTypeRow, 'id' | 'created_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealTypeRow> {
    const client = this.getExecutor(trx);
    return client
      .insertInto('mess_meal_types')
      .values(mealType)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async listMealPlans(
    organizationId: string,
    messId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealPlanRow[]> {
    const client = this.getExecutor(trx);
    return client
      .selectFrom('mess_meal_plans')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('mess_id', '=', messId)
      .where('is_active', '=', true)
      .orderBy('created_at', 'asc')
      .execute();
  }

  public async findMealPlanById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealPlanRow | null> {
    const client = this.getExecutor(trx);
    const row = await client
      .selectFrom('mess_meal_plans')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async createMealPlan(
    plan: Omit<MessMealPlanRow, 'id' | 'created_at' | 'updated_at' | 'version' | 'description'> & {
      version?: number;
      description?: string | null;
    },
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealPlanRow> {
    const client = this.getExecutor(trx);
    return client
      .insertInto('mess_meal_plans')
      .values({
        ...plan,
        description: plan.description ?? null,
        version: plan.version ?? 1,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async findMenuByDate(
    organizationId: string,
    messId: string,
    date: string,
    mealTypeId: string
  ): Promise<(MessMenuRow & { items: MessMenuItemRow[] }) | null> {
    const menu = await this.db
      .selectFrom('mess_menus')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('mess_id', '=', messId)
      .where('menu_date', '=', date)
      .where('meal_type_id', '=', mealTypeId)
      .executeTakeFirst();
    if (!menu) return null;
    const items = await this.db
      .selectFrom('mess_menu_items')
      .selectAll()
      .where('menu_id', '=', menu.id)
      .orderBy('display_order', 'asc')
      .execute();
    return { ...menu, items };
  }

  public async upsertMenu(
    organizationId: string,
    menuData: Omit<MessMenuRow, 'id' | 'created_at' | 'updated_at'>,
    items: Omit<MessMenuItemRow, 'id' | 'menu_id'>[],
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMenuRow> {
    const client = this.getExecutor(trx);
    const existing = await client
      .selectFrom('mess_menus')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('mess_id', '=', menuData.mess_id)
      .where('menu_date', '=', menuData.menu_date)
      .where('meal_type_id', '=', menuData.meal_type_id)
      .executeTakeFirst();
    let menuId = existing?.id;
    let menuRow: MessMenuRow;

    if (existing) {
      menuRow = await client
        .updateTable('mess_menus')
        .set({ notes: menuData.notes, updated_at: sql`NOW()` as never })
        .where('id', '=', existing.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      await client.deleteFrom('mess_menu_items').where('menu_id', '=', existing.id).execute();
    } else {
      menuRow = await client
        .insertInto('mess_menus')
        .values(menuData)
        .returningAll()
        .executeTakeFirstOrThrow();
      menuId = menuRow.id;
    }

    if (items.length > 0 && menuId) {
      for (const item of items) {
        await client
          .insertInto('mess_menu_items')
          .values({ menu_id: menuId, ...item })
          .execute();
      }
    }
    return menuRow;
  }

  public async findSubscriptionById(
    organizationId: string,
    id: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentMessSubscriptionRow | null> {
    const client = this.getExecutor(trx);
    if (
      !client ||
      typeof (client as unknown as Record<string, unknown>).selectFrom !== 'function'
    ) {
      return null;
    }
    const row = await client
      .selectFrom('resident_mess_subscriptions')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('id', '=', id)
      .executeTakeFirst();
    return row || null;
  }

  public async findActiveSubscriptionByStay(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentMessSubscriptionRow | null> {
    const client = this.getExecutor(trx);
    const row = await client
      .selectFrom('resident_mess_subscriptions')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
    return row || null;
  }

  public async findActiveSubscriptionByResident(
    organizationId: string,
    residentId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentMessSubscriptionRow | null> {
    const client = this.getExecutor(trx);
    const row = await client
      .selectFrom('resident_mess_subscriptions')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('resident_id', '=', residentId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
    return row || null;
  }

  public async createSubscription(
    sub: Omit<ResidentMessSubscriptionRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentMessSubscriptionRow> {
    const client = this.getExecutor(trx);
    return client
      .insertInto('resident_mess_subscriptions')
      .values(sub)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async supersedeActiveSubscription(
    organizationId: string,
    stayId: string,
    endDate: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<void> {
    const client = this.getExecutor(trx);
    await client
      .updateTable('resident_mess_subscriptions')
      .set({ status: 'SUPERSEDED', end_date: endDate, updated_at: sql`NOW()` as never })
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .where('status', '=', 'ACTIVE')
      .execute();
  }

  public async cancelActiveSubscription(
    organizationId: string,
    stayId: string,
    endDate: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<void> {
    const client = this.getExecutor(trx);
    await client
      .updateTable('resident_mess_subscriptions')
      .set({ status: 'CANCELLED', end_date: endDate, updated_at: sql`NOW()` as never })
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .where('status', '=', 'ACTIVE')
      .execute();
  }

  public async endActiveSubscription(
    organizationId: string,
    stayId: string,
    endDate: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<void> {
    const client = this.getExecutor(trx);
    await client
      .updateTable('resident_mess_subscriptions')
      .set({ status: 'COMPLETED', end_date: endDate, updated_at: sql`NOW()` as never })
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .where('status', '=', 'ACTIVE')
      .execute();
  }

  public async recordConsumption(
    cons: Omit<MessMealConsumptionRow, 'id' | 'created_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealConsumptionRow> {
    const client = this.getExecutor(trx);
    return client
      .insertInto('mess_meal_consumptions')
      .values(cons)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async findConsumptionsByDate(
    organizationId: string,
    messId: string,
    date: string
  ): Promise<MessMealConsumptionRow[]> {
    return this.db
      .selectFrom('mess_meal_consumptions')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('mess_id', '=', messId)
      .where('consumption_date', '=', date)
      .execute();
  }

  public async getTodayConsumptionMetrics(
    organizationId: string,
    messId: string,
    date: string
  ): Promise<{ expected: number; consumed: number; skipped: number }> {
    const activeSubCountResult = await this.db
      .selectFrom('resident_mess_subscriptions')
      .select(sql<number>`count(*)::int`.as('cnt'))
      .where('organization_id', '=', organizationId)
      .where('mess_id', '=', messId)
      .where('status', '=', 'ACTIVE')
      .executeTakeFirst();
    const consumptions = await this.findConsumptionsByDate(organizationId, messId, date);

    const expected = activeSubCountResult?.cnt || 0;
    const consumed = consumptions.filter((c) => c.status === 'CONSUMED').length;
    const skipped = consumptions.filter((c) => c.status === 'SKIPPED').length;

    return { expected, consumed, skipped };
  }
}
