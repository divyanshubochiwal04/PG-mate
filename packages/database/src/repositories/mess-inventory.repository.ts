import { type Kysely, sql, type Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type {
  MessExpenseCategory,
  MessExpenseRow,
  MessInventoryItemRow,
  MessInventoryTransactionRow,
  MessProcurementItemRow,
  MessProcurementRow,
  MessVendorRow,
} from '../schema/mess.schema';

export class KyselyMessInventoryRepository {
  constructor(protected readonly db: Kysely<DatabaseSchema>) {}

  protected getExecutor(
    trx?: Transaction<DatabaseSchema>
  ): Kysely<DatabaseSchema> | Transaction<DatabaseSchema> {
    return (
      trx && typeof (trx as unknown as Record<string, unknown>).selectFrom === 'function'
        ? trx
        : this.db
    );
  }

  // --- INVENTORY ITEMS ---

  public async listInventoryItems(
    organizationId: string,
    messId: string,
    page: number,
    pageSize: number,
    options?: {
      search?: string;
      category?: string;
      status?: MessInventoryItemRow['status'];
    }
  ): Promise<{ items: MessInventoryItemRow[]; total: number }> {
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
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', searchTerm),
          eb('category', 'ilike', searchTerm),
        ])
      );
    }

    const countRes = await query
      .select(sql<number>`count(*)::int`.as('cnt'))
      .executeTakeFirst();

    const items = await query
      .selectAll()
      .orderBy('name', 'asc')
      .limit(pageSize)
      .offset(offset)
      .execute();

    return { items, total: countRes?.cnt || 0 };
  }

  public async findInventoryItemById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessInventoryItemRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('mess_inventory_items')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async findInventoryItemByIdForUpdate(
    id: string,
    organizationId: string,
    trx: Transaction<DatabaseSchema>
  ): Promise<MessInventoryItemRow | null> {
    const row = await trx
      .selectFrom('mess_inventory_items')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .forUpdate()
      .executeTakeFirst();
    return row || null;
  }

  public async createInventoryItem(
    item: Omit<MessInventoryItemRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessInventoryItemRow> {
    const client = this.getExecutor(trx);
    return client
      .insertInto('mess_inventory_items')
      .values(item)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async updateInventoryItem(
    id: string,
    organizationId: string,
    data: Partial<Omit<MessInventoryItemRow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessInventoryItemRow> {
    const client = this.getExecutor(trx);
    return client
      .updateTable('mess_inventory_items')
      .set({ ...data, updated_at: sql`NOW()` as never })
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async updateItemStock(
    id: string,
    organizationId: string,
    currentStock: number,
    status: MessInventoryItemRow['status'],
    trx: Transaction<DatabaseSchema>
  ): Promise<void> {
    await trx
      .updateTable('mess_inventory_items')
      .set({ current_stock: currentStock, status, updated_at: sql`NOW()` as never })
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .execute();
  }

  // --- STOCK LEDGER ---

  public async recordInventoryTransaction(
    txData: Omit<MessInventoryTransactionRow, 'id' | 'created_at'>,
    trx: Transaction<DatabaseSchema>
  ): Promise<MessInventoryTransactionRow> {
    return trx
      .insertInto('mess_inventory_transactions')
      .values(txData)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async getInventoryStockLedger(
    organizationId: string,
    inventoryItemId: string,
    page = 1,
    pageSize = 20,
    trx?: Transaction<DatabaseSchema>
  ): Promise<{ items: MessInventoryTransactionRow[]; total: number }> {
    const executor = this.getExecutor(trx);
    const offset = (page - 1) * pageSize;

    const countRes = await executor
      .selectFrom('mess_inventory_transactions')
      .select(sql<number>`count(*)::int`.as('cnt'))
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

  public async listVendors(
    organizationId: string,
    page: number,
    pageSize: number,
    options?: {
      search?: string;
      status?: MessVendorRow['status'];
    }
  ): Promise<{ items: MessVendorRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    let query = this.db
      .selectFrom('mess_vendors')
      .where('organization_id', '=', organizationId);

    if (options?.status) {
      query = query.where('status', '=', options.status);
    }
    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', searchTerm),
          eb('phone', 'ilike', searchTerm),
          eb('email', 'ilike', searchTerm),
        ])
      );
    }

    const countRes = await query
      .select(sql<number>`count(*)::int`.as('cnt'))
      .executeTakeFirst();

    const items = await query
      .selectAll()
      .orderBy('name', 'asc')
      .limit(pageSize)
      .offset(offset)
      .execute();

    return { items, total: countRes?.cnt || 0 };
  }

  public async findVendorById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessVendorRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('mess_vendors')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async createVendor(
    vendor: Omit<MessVendorRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessVendorRow> {
    const client = this.getExecutor(trx);
    return client
      .insertInto('mess_vendors')
      .values(vendor)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  public async updateVendor(
    id: string,
    organizationId: string,
    data: Partial<Omit<MessVendorRow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessVendorRow> {
    const client = this.getExecutor(trx);
    return client
      .updateTable('mess_vendors')
      .set({ ...data, updated_at: sql`NOW()` as never })
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // --- PROCUREMENTS ---

  public async listProcurements(
    organizationId: string,
    messId: string,
    page: number,
    pageSize: number,
    options?: {
      search?: string;
      vendorId?: string;
    }
  ): Promise<{ items: MessProcurementRow[]; total: number }> {
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
      query = query.where((eb) =>
        eb.or([
          eb('invoice_reference', 'ilike', searchTerm),
          eb('notes', 'ilike', searchTerm),
        ])
      );
    }

    const countRes = await query
      .select(sql<number>`count(*)::int`.as('cnt'))
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

  public async findProcurementById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<(MessProcurementRow & { items: (MessProcurementItemRow & { itemName?: string })[] }) | null> {
    const executor = this.getExecutor(trx);
    const proc = await executor
      .selectFrom('mess_procurements')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    if (!proc) return null;

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

  public async findProcurementByInvoiceReference(
    organizationId: string,
    invoiceReference: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessProcurementRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('mess_procurements')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('invoice_reference', '=', invoiceReference)
      .executeTakeFirst();
    return row || null;
  }

  public async createProcurement(
    procData: Omit<MessProcurementRow, 'id' | 'created_at' | 'updated_at'>,
    itemData: Omit<MessProcurementItemRow, 'id' | 'procurement_id'>[],
    trx: Transaction<DatabaseSchema>
  ): Promise<MessProcurementRow> {
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

  public async listExpenses(
    organizationId: string,
    messId: string,
    page: number,
    pageSize: number,
    options?: {
      search?: string;
      category?: MessExpenseCategory;
      vendorId?: string;
    }
  ): Promise<{ items: MessExpenseRow[]; total: number }> {
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
      query = query.where((eb) =>
        eb.or([
          eb('reference_no', 'ilike', searchTerm),
          eb('notes', 'ilike', searchTerm),
        ])
      );
    }

    const countRes = await query
      .select(sql<number>`count(*)::int`.as('cnt'))
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

  public async findExpenseById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessExpenseRow | null> {
    const executor = this.getExecutor(trx);
    const row = await executor
      .selectFrom('mess_expenses')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async createExpense(
    exp: Omit<MessExpenseRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessExpenseRow> {
    const client = this.getExecutor(trx);
    return client.insertInto('mess_expenses').values(exp).returningAll().executeTakeFirstOrThrow();
  }
}
