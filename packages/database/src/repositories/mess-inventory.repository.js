"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyMessInventoryRepository = void 0;
const kysely_1 = require("kysely");
class KyselyMessInventoryRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getExecutor(trx) {
        return (trx && typeof trx.selectFrom === 'function'
            ? trx
            : this.db);
    }
    // --- INVENTORY ITEMS ---
    async listInventoryItems(organizationId, messId, page, pageSize, options) {
        const offset = (page - 1) * pageSize;
        let query = this.db
            .selectFrom('mess_inventory_items')
            .where('organization_id', '=', organizationId)
            .where('mess_id', '=', messId);
        if (options?.category) {
            query = query.where('category', '=', options.category);
        }
        if (options?.status) {
            query = query.where('status', '=', options.status);
        }
        if (options?.search) {
            const searchTerm = `%${options.search}%`;
            query = query.where((eb) => eb.or([
                eb('name', 'ilike', searchTerm),
                eb('category', 'ilike', searchTerm),
            ]));
        }
        const countRes = await query
            .select((0, kysely_1.sql) `count(*)::int`.as('cnt'))
            .executeTakeFirst();
        const items = await query
            .selectAll()
            .orderBy('name', 'asc')
            .limit(pageSize)
            .offset(offset)
            .execute();
        return { items, total: countRes?.cnt || 0 };
    }
    async findInventoryItemById(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('mess_inventory_items')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findInventoryItemByIdForUpdate(id, organizationId, trx) {
        const row = await trx
            .selectFrom('mess_inventory_items')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .forUpdate()
            .executeTakeFirst();
        return row || null;
    }
    async createInventoryItem(item, trx) {
        const client = this.getExecutor(trx);
        return client
            .insertInto('mess_inventory_items')
            .values(item)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async updateInventoryItem(id, organizationId, data, trx) {
        const client = this.getExecutor(trx);
        return client
            .updateTable('mess_inventory_items')
            .set({ ...data, updated_at: (0, kysely_1.sql) `NOW()` })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async updateItemStock(id, organizationId, currentStock, status, trx) {
        await trx
            .updateTable('mess_inventory_items')
            .set({ current_stock: currentStock, status, updated_at: (0, kysely_1.sql) `NOW()` })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .execute();
    }
    // --- STOCK LEDGER ---
    async recordInventoryTransaction(txData, trx) {
        return trx
            .insertInto('mess_inventory_transactions')
            .values(txData)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async getInventoryStockLedger(organizationId, inventoryItemId, page = 1, pageSize = 20, trx) {
        const executor = this.getExecutor(trx);
        const offset = (page - 1) * pageSize;
        const countRes = await executor
            .selectFrom('mess_inventory_transactions')
            .select((0, kysely_1.sql) `count(*)::int`.as('cnt'))
            .where('organization_id', '=', organizationId)
            .where('inventory_item_id', '=', inventoryItemId)
            .executeTakeFirst();
        const items = await executor
            .selectFrom('mess_inventory_transactions')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('inventory_item_id', '=', inventoryItemId)
            .orderBy('created_at', 'desc')
            .limit(pageSize)
            .offset(offset)
            .execute();
        return { items, total: countRes?.cnt || 0 };
    }
    // --- VENDORS ---
    async listVendors(organizationId, page, pageSize, options) {
        const offset = (page - 1) * pageSize;
        let query = this.db
            .selectFrom('mess_vendors')
            .where('organization_id', '=', organizationId);
        if (options?.status) {
            query = query.where('status', '=', options.status);
        }
        if (options?.search) {
            const searchTerm = `%${options.search}%`;
            query = query.where((eb) => eb.or([
                eb('name', 'ilike', searchTerm),
                eb('phone', 'ilike', searchTerm),
                eb('email', 'ilike', searchTerm),
            ]));
        }
        const countRes = await query
            .select((0, kysely_1.sql) `count(*)::int`.as('cnt'))
            .executeTakeFirst();
        const items = await query
            .selectAll()
            .orderBy('name', 'asc')
            .limit(pageSize)
            .offset(offset)
            .execute();
        return { items, total: countRes?.cnt || 0 };
    }
    async findVendorById(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('mess_vendors')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async createVendor(vendor, trx) {
        const client = this.getExecutor(trx);
        return client
            .insertInto('mess_vendors')
            .values(vendor)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async updateVendor(id, organizationId, data, trx) {
        const client = this.getExecutor(trx);
        return client
            .updateTable('mess_vendors')
            .set({ ...data, updated_at: (0, kysely_1.sql) `NOW()` })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    // --- PROCUREMENTS ---
    async listProcurements(organizationId, messId, page, pageSize, options) {
        const offset = (page - 1) * pageSize;
        let query = this.db
            .selectFrom('mess_procurements')
            .where('organization_id', '=', organizationId)
            .where('mess_id', '=', messId);
        if (options?.vendorId) {
            query = query.where('vendor_id', '=', options.vendorId);
        }
        if (options?.search) {
            const searchTerm = `%${options.search}%`;
            query = query.where((eb) => eb.or([
                eb('invoice_reference', 'ilike', searchTerm),
                eb('notes', 'ilike', searchTerm),
            ]));
        }
        const countRes = await query
            .select((0, kysely_1.sql) `count(*)::int`.as('cnt'))
            .executeTakeFirst();
        const items = await query
            .selectAll()
            .orderBy('purchase_date', 'desc')
            .orderBy('created_at', 'desc')
            .limit(pageSize)
            .offset(offset)
            .execute();
        return { items, total: countRes?.cnt || 0 };
    }
    async findProcurementById(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const proc = await executor
            .selectFrom('mess_procurements')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        if (!proc)
            return null;
        const items = await executor
            .selectFrom('mess_procurement_items')
            .innerJoin('mess_inventory_items', 'mess_inventory_items.id', 'mess_procurement_items.inventory_item_id')
            .select([
            'mess_procurement_items.id',
            'mess_procurement_items.procurement_id',
            'mess_procurement_items.inventory_item_id',
            'mess_procurement_items.quantity',
            'mess_procurement_items.unit_price',
            'mess_procurement_items.total_price',
            'mess_inventory_items.name as itemName',
        ])
            .where('mess_procurement_items.procurement_id', '=', proc.id)
            .execute();
        return { ...proc, items };
    }
    async findProcurementByInvoiceReference(organizationId, invoiceReference, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('mess_procurements')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('invoice_reference', '=', invoiceReference)
            .executeTakeFirst();
        return row || null;
    }
    async createProcurement(procData, itemData, trx) {
        const proc = await trx
            .insertInto('mess_procurements')
            .values(procData)
            .returningAll()
            .executeTakeFirstOrThrow();
        for (const item of itemData) {
            await trx
                .insertInto('mess_procurement_items')
                .values({ procurement_id: proc.id, ...item })
                .execute();
        }
        return proc;
    }
    // --- EXPENSES ---
    async listExpenses(organizationId, messId, page, pageSize, options) {
        const offset = (page - 1) * pageSize;
        let query = this.db
            .selectFrom('mess_expenses')
            .where('organization_id', '=', organizationId)
            .where('mess_id', '=', messId);
        if (options?.category) {
            query = query.where('category', '=', options.category);
        }
        if (options?.vendorId) {
            query = query.where('vendor_id', '=', options.vendorId);
        }
        if (options?.search) {
            const searchTerm = `%${options.search}%`;
            query = query.where((eb) => eb.or([
                eb('reference_no', 'ilike', searchTerm),
                eb('notes', 'ilike', searchTerm),
            ]));
        }
        const countRes = await query
            .select((0, kysely_1.sql) `count(*)::int`.as('cnt'))
            .executeTakeFirst();
        const items = await query
            .selectAll()
            .orderBy('expense_date', 'desc')
            .orderBy('created_at', 'desc')
            .limit(pageSize)
            .offset(offset)
            .execute();
        return { items, total: countRes?.cnt || 0 };
    }
    async findExpenseById(id, organizationId, trx) {
        const executor = this.getExecutor(trx);
        const row = await executor
            .selectFrom('mess_expenses')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async createExpense(exp, trx) {
        const client = this.getExecutor(trx);
        return client.insertInto('mess_expenses').values(exp).returningAll().executeTakeFirstOrThrow();
    }
}
exports.KyselyMessInventoryRepository = KyselyMessInventoryRepository;
//# sourceMappingURL=mess-inventory.repository.js.map