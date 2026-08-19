import { type Kysely, type Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type { MessExpenseCategory, MessExpenseRow, MessInventoryItemRow, MessInventoryTransactionRow, MessProcurementItemRow, MessProcurementRow, MessVendorRow } from '../schema/mess.schema';
export declare class KyselyMessInventoryRepository {
    protected readonly db: Kysely<DatabaseSchema>;
    constructor(db: Kysely<DatabaseSchema>);
    protected getExecutor(trx?: Transaction<DatabaseSchema>): Kysely<DatabaseSchema> | Transaction<DatabaseSchema>;
    listInventoryItems(organizationId: string, messId: string, page: number, pageSize: number, options?: {
        search?: string;
        category?: string;
        status?: MessInventoryItemRow['status'];
    }): Promise<{
        items: MessInventoryItemRow[];
        total: number;
    }>;
    findInventoryItemById(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<MessInventoryItemRow | null>;
    findInventoryItemByIdForUpdate(id: string, organizationId: string, trx: Transaction<DatabaseSchema>): Promise<MessInventoryItemRow | null>;
    createInventoryItem(item: Omit<MessInventoryItemRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<MessInventoryItemRow>;
    updateInventoryItem(id: string, organizationId: string, data: Partial<Omit<MessInventoryItemRow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>, trx?: Transaction<DatabaseSchema>): Promise<MessInventoryItemRow>;
    updateItemStock(id: string, organizationId: string, currentStock: number, status: MessInventoryItemRow['status'], trx: Transaction<DatabaseSchema>): Promise<void>;
    recordInventoryTransaction(txData: Omit<MessInventoryTransactionRow, 'id' | 'created_at'>, trx: Transaction<DatabaseSchema>): Promise<MessInventoryTransactionRow>;
    getInventoryStockLedger(organizationId: string, inventoryItemId: string, page?: number, pageSize?: number, trx?: Transaction<DatabaseSchema>): Promise<{
        items: MessInventoryTransactionRow[];
        total: number;
    }>;
    listVendors(organizationId: string, page: number, pageSize: number, options?: {
        search?: string;
        status?: MessVendorRow['status'];
    }): Promise<{
        items: MessVendorRow[];
        total: number;
    }>;
    findVendorById(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<MessVendorRow | null>;
    createVendor(vendor: Omit<MessVendorRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<MessVendorRow>;
    updateVendor(id: string, organizationId: string, data: Partial<Omit<MessVendorRow, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>, trx?: Transaction<DatabaseSchema>): Promise<MessVendorRow>;
    listProcurements(organizationId: string, messId: string, page: number, pageSize: number, options?: {
        search?: string;
        vendorId?: string;
    }): Promise<{
        items: MessProcurementRow[];
        total: number;
    }>;
    findProcurementById(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<(MessProcurementRow & {
        items: (MessProcurementItemRow & {
            itemName?: string;
        })[];
    }) | null>;
    findProcurementByInvoiceReference(organizationId: string, invoiceReference: string, trx?: Transaction<DatabaseSchema>): Promise<MessProcurementRow | null>;
    createProcurement(procData: Omit<MessProcurementRow, 'id' | 'created_at' | 'updated_at'>, itemData: Omit<MessProcurementItemRow, 'id' | 'procurement_id'>[], trx: Transaction<DatabaseSchema>): Promise<MessProcurementRow>;
    listExpenses(organizationId: string, messId: string, page: number, pageSize: number, options?: {
        search?: string;
        category?: MessExpenseCategory;
        vendorId?: string;
    }): Promise<{
        items: MessExpenseRow[];
        total: number;
    }>;
    findExpenseById(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<MessExpenseRow | null>;
    createExpense(exp: Omit<MessExpenseRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<MessExpenseRow>;
}
//# sourceMappingURL=mess-inventory.repository.d.ts.map