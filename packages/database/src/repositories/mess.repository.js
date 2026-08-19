"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyMessRepository = void 0;
const kysely_1 = require("kysely");
const mess_inventory_repository_1 = require("./mess-inventory.repository");
class KyselyMessRepository extends mess_inventory_repository_1.KyselyMessInventoryRepository {
    constructor(db) {
        super(db);
    }
    getExecutor(trx) {
        return trx && typeof trx.selectFrom === 'function'
            ? trx
            : this.db;
    }
    async getConfig(organizationId, trx) {
        const client = this.getExecutor(trx);
        const row = await client
            .selectFrom('mess_configurations')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async upsertConfig(organizationId, data, trx) {
        const client = this.getExecutor(trx);
        const existing = await this.getConfig(organizationId, trx);
        if (existing) {
            const updated = await client
                .updateTable('mess_configurations')
                .set({
                is_enabled: data.isEnabled !== undefined ? data.isEnabled : existing.is_enabled,
                scope_type: data.scopeType || existing.scope_type,
                billing_mode: data.billingMode || existing.billing_mode,
                updated_at: (0, kysely_1.sql) `NOW()`,
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
    async listMesses(organizationId, trx) {
        const client = this.getExecutor(trx);
        return client
            .selectFrom('messes')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .orderBy('created_at', 'asc')
            .execute();
    }
    async findMessById(id, organizationId, trx) {
        const client = this.getExecutor(trx);
        const row = await client
            .selectFrom('messes')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async createMess(mess, trx) {
        const client = this.getExecutor(trx);
        return client.insertInto('messes').values(mess).returningAll().executeTakeFirstOrThrow();
    }
    async assignBuildings(organizationId, messId, buildingIds, trx) {
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
    async getBuildingAssignments(organizationId, messId) {
        return this.db
            .selectFrom('mess_building_assignments')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('mess_id', '=', messId)
            .where('is_active', '=', true)
            .execute();
    }
    async listMealTypes(organizationId, messId, trx) {
        const client = this.getExecutor(trx);
        return client
            .selectFrom('mess_meal_types')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('mess_id', '=', messId)
            .orderBy('display_order', 'asc')
            .execute();
    }
    async createMealType(mealType, trx) {
        const client = this.getExecutor(trx);
        return client
            .insertInto('mess_meal_types')
            .values(mealType)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async listMealPlans(organizationId, messId, trx) {
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
    async findMealPlanById(id, organizationId, trx) {
        const client = this.getExecutor(trx);
        const row = await client
            .selectFrom('mess_meal_plans')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async createMealPlan(plan, trx) {
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
    async findMenuByDate(organizationId, messId, date, mealTypeId) {
        const menu = await this.db
            .selectFrom('mess_menus')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('mess_id', '=', messId)
            .where('menu_date', '=', date)
            .where('meal_type_id', '=', mealTypeId)
            .executeTakeFirst();
        if (!menu)
            return null;
        const items = await this.db
            .selectFrom('mess_menu_items')
            .selectAll()
            .where('menu_id', '=', menu.id)
            .orderBy('display_order', 'asc')
            .execute();
        return { ...menu, items };
    }
    async upsertMenu(organizationId, menuData, items, trx) {
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
        let menuRow;
        if (existing) {
            menuRow = await client
                .updateTable('mess_menus')
                .set({ notes: menuData.notes, updated_at: (0, kysely_1.sql) `NOW()` })
                .where('id', '=', existing.id)
                .returningAll()
                .executeTakeFirstOrThrow();
            await client.deleteFrom('mess_menu_items').where('menu_id', '=', existing.id).execute();
        }
        else {
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
    async findSubscriptionById(organizationId, id, trx) {
        const client = this.getExecutor(trx);
        if (!client ||
            typeof client.selectFrom !== 'function') {
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
    async findActiveSubscriptionByStay(organizationId, stayId, trx) {
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
    async findActiveSubscriptionByResident(organizationId, residentId, trx) {
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
    async createSubscription(sub, trx) {
        const client = this.getExecutor(trx);
        return client
            .insertInto('resident_mess_subscriptions')
            .values(sub)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async supersedeActiveSubscription(organizationId, stayId, endDate, trx) {
        const client = this.getExecutor(trx);
        await client
            .updateTable('resident_mess_subscriptions')
            .set({ status: 'SUPERSEDED', end_date: endDate, updated_at: (0, kysely_1.sql) `NOW()` })
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('status', '=', 'ACTIVE')
            .execute();
    }
    async cancelActiveSubscription(organizationId, stayId, endDate, trx) {
        const client = this.getExecutor(trx);
        await client
            .updateTable('resident_mess_subscriptions')
            .set({ status: 'CANCELLED', end_date: endDate, updated_at: (0, kysely_1.sql) `NOW()` })
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('status', '=', 'ACTIVE')
            .execute();
    }
    async endActiveSubscription(organizationId, stayId, endDate, trx) {
        const client = this.getExecutor(trx);
        await client
            .updateTable('resident_mess_subscriptions')
            .set({ status: 'COMPLETED', end_date: endDate, updated_at: (0, kysely_1.sql) `NOW()` })
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('status', '=', 'ACTIVE')
            .execute();
    }
    async recordConsumption(cons, trx) {
        const client = this.getExecutor(trx);
        return client
            .insertInto('mess_meal_consumptions')
            .values(cons)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async findConsumptionsByDate(organizationId, messId, date) {
        return this.db
            .selectFrom('mess_meal_consumptions')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('mess_id', '=', messId)
            .where('consumption_date', '=', date)
            .execute();
    }
    async getTodayConsumptionMetrics(organizationId, messId, date) {
        const activeSubCountResult = await this.db
            .selectFrom('resident_mess_subscriptions')
            .select((0, kysely_1.sql) `count(*)::int`.as('cnt'))
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
exports.KyselyMessRepository = KyselyMessRepository;
//# sourceMappingURL=mess.repository.js.map