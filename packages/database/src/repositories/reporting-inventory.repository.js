"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyInventoryReportingRepository = void 0;
const kysely_1 = require("kysely");
const contracts_1 = require("@m-square/contracts");
class KyselyInventoryReportingRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getInventoryReport(organizationId, filter) {
        const page = filter.page && filter.page > 0 ? filter.page : 1;
        const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(page, pageSize);
        let query = this.db
            .selectFrom('mess_inventory_items as item')
            .where('item.organization_id', '=', organizationId);
        if (filter.search && filter.search.trim().length > 0) {
            const term = `%${filter.search.trim().toLowerCase()}%`;
            query = query.where((eb) => eb.or([eb('item.name', 'ilike', term), eb('item.category', 'ilike', term)]));
        }
        const countRes = await query
            .select((0, kysely_1.sql) `COUNT(DISTINCT item.id)::int`.as('total'))
            .executeTakeFirstOrThrow();
        const total = countRes.total || 0;
        const summaryRes = await this.db
            .selectFrom('mess_inventory_items as item')
            .select([
            (0, kysely_1.sql) `COUNT(id)::int`.as('totalItems'),
            (0, kysely_1.sql) `COUNT(CASE WHEN current_stock > reorder_level THEN 1 END)::int`.as('inStockItems'),
            (0, kysely_1.sql) `COUNT(CASE WHEN current_stock <= reorder_level AND current_stock > 0 THEN 1 END)::int`.as('lowStockItems'),
            (0, kysely_1.sql) `COUNT(CASE WHEN current_stock <= 0 THEN 1 END)::int`.as('outOfStockItems'),
        ])
            .where('item.organization_id', '=', organizationId)
            .executeTakeFirst();
        const valueRes = await this.db
            .selectFrom('mess_procurements')
            .select((0, kysely_1.sql) `COALESCE(SUM(total_amount), 0)::float`.as('totalProcurementValue'))
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        const rows = await query
            .select([
            'item.id as inventoryItemId',
            'item.name as itemName',
            'item.category as category',
            'item.unit as unit',
            (0, kysely_1.sql) `item.current_stock::float`.as('currentStock'),
            (0, kysely_1.sql) `item.minimum_stock::float`.as('minimumStock'),
            'item.status as status',
            (0, kysely_1.sql) `COALESCE((
          SELECT SUM(pl.quantity) FROM mess_procurement_items pl JOIN mess_procurements p ON p.id = pl.procurement_id WHERE pl.inventory_item_id = item.id AND p.organization_id = ${organizationId}
        ), 0)::float`.as('totalProcuredQuantity'),
            (0, kysely_1.sql) `COALESCE((
          SELECT SUM(sl.quantity) FROM mess_inventory_transactions sl WHERE sl.inventory_item_id = item.id AND sl.transaction_type IN ('ADJUSTMENT_OUT', 'CONSUMPTION', 'WASTAGE') AND sl.organization_id = ${organizationId}
        ), 0)::float`.as('totalConsumedQuantity'),
            (0, kysely_1.sql) `COALESCE((
          SELECT SUM(pl.total_price) FROM mess_procurement_items pl JOIN mess_procurements p ON p.id = pl.procurement_id WHERE pl.inventory_item_id = item.id AND p.organization_id = ${organizationId}
        ), 0)::float`.as('totalProcurementValue'),
        ])
            .orderBy('item.created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .execute();
        const formattedRows = rows.map((r) => ({
            inventoryItemId: r.inventoryItemId,
            itemName: r.itemName,
            category: r.category,
            unit: r.unit,
            currentStock: Number(r.currentStock || 0),
            minimumStock: Number(r.minimumStock || 0),
            status: r.status,
            totalProcuredQuantity: Number(r.totalProcuredQuantity || 0),
            totalConsumedQuantity: Number(r.totalConsumedQuantity || 0),
            totalProcurementValue: Number(r.totalProcurementValue || 0),
        }));
        return {
            summary: {
                totalItems: Number(summaryRes?.totalItems || 0),
                inStockItems: Number(summaryRes?.inStockItems || 0),
                lowStockItems: Number(summaryRes?.lowStockItems || 0),
                outOfStockItems: Number(summaryRes?.outOfStockItems || 0),
                totalProcurementValue: Number(valueRes?.totalProcurementValue || 0),
            },
            rows: formattedRows,
            page,
            pageSize,
            total,
        };
    }
    async getProcurementReport(organizationId, filter) {
        const page = filter.page && filter.page > 0 ? filter.page : 1;
        const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(page, pageSize);
        let query = this.db
            .selectFrom('mess_procurements as p')
            .leftJoin('mess_vendors as v', 'v.id', 'p.vendor_id')
            .where('p.organization_id', '=', organizationId);
        if (filter.fromDate) {
            query = query.where('p.purchase_date', '>=', filter.fromDate);
        }
        if (filter.toDate) {
            query = query.where('p.purchase_date', '<=', filter.toDate);
        }
        if (filter.search && filter.search.trim().length > 0) {
            const term = `%${filter.search.trim().toLowerCase()}%`;
            query = query.where((eb) => eb.or([eb('p.invoice_reference', 'ilike', term), eb('v.name', 'ilike', term)]));
        }
        const countRes = await query
            .select((0, kysely_1.sql) `COUNT(DISTINCT p.id)::int`.as('total'))
            .executeTakeFirstOrThrow();
        const total = countRes.total || 0;
        const summaryRes = await query
            .select([
            (0, kysely_1.sql) `COUNT(DISTINCT p.id)::int`.as('procurementCount'),
            (0, kysely_1.sql) `COALESCE(SUM(p.total_amount), 0)::float`.as('totalProcurementAmount'),
        ])
            .executeTakeFirst();
        const rows = await query
            .select([
            'p.id as procurementId',
            'p.invoice_reference as invoiceReference',
            'v.id as vendorId',
            'v.name as vendorName',
            'p.purchase_date as procurementDate',
            (0, kysely_1.sql) `p.total_amount::float`.as('totalAmount'),
            (0, kysely_1.sql) `(SELECT COUNT(pl.id)::int FROM mess_procurement_items pl WHERE pl.procurement_id = p.id)`.as('itemCount'),
        ])
            .orderBy('p.created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .execute();
        const formattedRows = rows.map((r) => ({
            procurementId: r.procurementId,
            invoiceReference: r.invoiceReference || '',
            vendorId: r.vendorId || null,
            vendorName: r.vendorName || 'Unknown Vendor',
            procurementDate: new Date(r.procurementDate).toISOString().split('T')[0],
            totalAmount: Number(r.totalAmount || 0),
            itemCount: Number(r.itemCount || 0),
        }));
        return {
            summary: {
                procurementCount: Number(summaryRes?.procurementCount || 0),
                totalProcurementAmount: Number(summaryRes?.totalProcurementAmount || 0),
            },
            rows: formattedRows,
            page,
            pageSize,
            total,
        };
    }
}
exports.KyselyInventoryReportingRepository = KyselyInventoryReportingRepository;
//# sourceMappingURL=reporting-inventory.repository.js.map