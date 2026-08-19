"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyFinancialReportingRepository = void 0;
const kysely_1 = require("kysely");
const contracts_1 = require("@m-square/contracts");
class KyselyFinancialReportingRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getExpenseReport(organizationId, filter) {
        const page = filter.page && filter.page > 0 ? filter.page : 1;
        const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(page, pageSize);
        let query = this.db
            .selectFrom('mess_expenses as e')
            .leftJoin('mess_vendors as v', 'v.id', 'e.vendor_id')
            .where('e.organization_id', '=', organizationId);
        if (filter.fromDate) {
            query = query.where('e.expense_date', '>=', filter.fromDate);
        }
        if (filter.toDate) {
            query = query.where('e.expense_date', '<=', filter.toDate);
        }
        if (filter.search && filter.search.trim().length > 0) {
            const term = `%${filter.search.trim().toLowerCase()}%`;
            query = query.where((eb) => eb.or([
                eb((0, kysely_1.sql) `e.category::text`, 'ilike', term),
                eb('e.notes', 'ilike', term),
                eb('v.name', 'ilike', term),
            ]));
        }
        const countRes = await query
            .select((0, kysely_1.sql) `COUNT(DISTINCT e.id)::int`.as('total'))
            .executeTakeFirstOrThrow();
        const total = countRes.total || 0;
        const summaryRes = await query
            .select([
            (0, kysely_1.sql) `COUNT(DISTINCT e.id)::int`.as('expenseCount'),
            (0, kysely_1.sql) `COALESCE(SUM(e.amount), 0)::float`.as('totalExpenses'),
        ])
            .executeTakeFirst();
        const categoryRows = await query
            .select([
            'e.category as category',
            (0, kysely_1.sql) `COUNT(e.id)::int`.as('count'),
            (0, kysely_1.sql) `COALESCE(SUM(e.amount), 0)::float`.as('totalAmount'),
        ])
            .groupBy('e.category')
            .orderBy('totalAmount', 'desc')
            .execute();
        const categories = categoryRows.map((c) => ({
            category: c.category,
            count: Number(c.count || 0),
            totalAmount: Number(c.totalAmount || 0),
        }));
        const rows = await query
            .select([
            'e.id as expenseId',
            'e.category as category',
            'e.notes as description',
            'v.name as vendorName',
            'e.expense_date as expenseDate',
            (0, kysely_1.sql) `e.amount::float`.as('amount'),
        ])
            .orderBy('e.created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .execute();
        const formattedRows = rows.map((r) => ({
            expenseId: r.expenseId,
            category: r.category,
            description: r.description || null,
            vendorName: r.vendorName || null,
            expenseDate: new Date(r.expenseDate).toISOString().split('T')[0],
            amount: Number(r.amount || 0),
        }));
        return {
            summary: {
                expenseCount: Number(summaryRes?.expenseCount || 0),
                totalExpenses: Number(summaryRes?.totalExpenses || 0),
            },
            categories,
            rows: formattedRows,
            page,
            pageSize,
            total,
        };
    }
    async getPropertyPerformanceReport(organizationId, filter) {
        let query = this.db
            .selectFrom('properties as p')
            .leftJoin('buildings as b', 'b.property_id', 'p.id')
            .where('p.organization_id', '=', organizationId);
        if (filter.propertyId)
            query = query.where('p.id', '=', filter.propertyId);
        if (filter.buildingId)
            query = query.where('b.id', '=', filter.buildingId);
        const rows = await query
            .select([
            'p.id as propertyId',
            'p.name as propertyName',
            'b.id as buildingId',
            'b.name as buildingName',
            (0, kysely_1.sql) `(SELECT COUNT(rm.id)::int FROM rooms rm JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND rm.organization_id = ${organizationId})`.as('totalRooms'),
            (0, kysely_1.sql) `(SELECT COUNT(bd.id)::int FROM beds bd JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND bd.organization_id = ${organizationId})`.as('totalBeds'),
            (0, kysely_1.sql) `(SELECT COUNT(DISTINCT ba.bed_id)::int FROM bed_allocations ba JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND ba.status = 'ACTIVE' AND ba.organization_id = ${organizationId})`.as('occupiedBeds'),
            (0, kysely_1.sql) `(SELECT COUNT(DISTINCT s.resident_id)::int FROM stays s JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND s.status = 'ACTIVE' AND s.organization_id = ${organizationId})`.as('activeResidents'),
            (0, kysely_1.sql) `COALESCE((SELECT SUM(inv.total_amount) FROM invoices inv JOIN stays s ON s.id = inv.stay_id JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND inv.organization_id = ${organizationId}), 0)::float`.as('totalInvoiced'),
            (0, kysely_1.sql) `COALESCE((SELECT SUM(inv.paid_amount) FROM invoices inv JOIN stays s ON s.id = inv.stay_id JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND inv.organization_id = ${organizationId}), 0)::float`.as('totalCollected'),
            (0, kysely_1.sql) `COALESCE((SELECT SUM(inv.balance_due_amount) FROM invoices inv JOIN stays s ON s.id = inv.stay_id JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND inv.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE') AND inv.organization_id = ${organizationId}), 0)::float`.as('totalOutstanding'),
            (0, kysely_1.sql) `COALESCE((SELECT SUM(e.amount) FROM mess_expenses e WHERE e.organization_id = ${organizationId}), 0)::float`.as('totalExpenses'),
            (0, kysely_1.sql) `COALESCE((SELECT COUNT(ms.id)::int FROM resident_mess_subscriptions ms JOIN stays s ON s.id = ms.stay_id JOIN bed_allocations ba ON ba.stay_id = s.id JOIN beds bd ON bd.id = ba.bed_id JOIN rooms rm ON rm.id = bd.room_id JOIN floors fl ON fl.id = rm.floor_id WHERE fl.building_id = b.id AND ms.status = 'ACTIVE' AND ms.organization_id = ${organizationId}), 0)`.as('activeMessSubscriptions'),
            (0, kysely_1.sql) `(SELECT COUNT(item.id)::int FROM mess_inventory_items item WHERE item.current_stock <= item.reorder_level AND item.organization_id = ${organizationId})`.as('lowStockItems'),
        ])
            .orderBy('p.name', 'asc')
            .orderBy('b.name', 'asc')
            .execute();
        let totalBedsSum = 0;
        let occupiedBedsSum = 0;
        let totalCollectedSum = 0;
        let totalExpensesSum = 0;
        const propertySet = new Set();
        const items = rows.map((r) => {
            const bTotalBeds = Number(r.totalBeds || 0);
            const bOccupiedBeds = Number(r.occupiedBeds || 0);
            const occPct = bTotalBeds > 0 ? Math.round((bOccupiedBeds / bTotalBeds) * 100) : 0;
            const invoiced = Number(r.totalInvoiced || 0);
            const collected = Number(r.totalCollected || 0);
            const outstanding = Number(r.totalOutstanding || 0);
            const exp = Number(r.totalExpenses || 0);
            const netCash = collected - exp;
            totalBedsSum += bTotalBeds;
            occupiedBedsSum += bOccupiedBeds;
            totalCollectedSum += collected;
            totalExpensesSum += exp;
            if (r.propertyId)
                propertySet.add(r.propertyId);
            return {
                propertyId: r.propertyId,
                propertyName: r.propertyName,
                buildingId: r.buildingId || null,
                buildingName: r.buildingName || null,
                totalRooms: Number(r.totalRooms || 0),
                totalBeds: bTotalBeds,
                occupiedBeds: bOccupiedBeds,
                occupancyPercentage: occPct,
                activeResidents: Number(r.activeResidents || 0),
                totalInvoiced: invoiced,
                totalCollected: collected,
                totalOutstanding: outstanding,
                totalExpenses: exp,
                netCashFlow: netCash,
                activeMessSubscriptions: Number(r.activeMessSubscriptions || 0),
                lowStockItems: Number(r.lowStockItems || 0),
            };
        });
        const overallOccPct = totalBedsSum > 0 ? Math.round((occupiedBedsSum / totalBedsSum) * 100) : 0;
        const netCashFlowSum = totalCollectedSum - totalExpensesSum;
        return {
            summary: {
                totalProperties: propertySet.size,
                totalBeds: totalBedsSum,
                occupiedBeds: occupiedBedsSum,
                overallOccupancyPercentage: overallOccPct,
                totalCollected: totalCollectedSum,
                totalExpenses: totalExpensesSum,
                totalNetCashFlow: netCashFlowSum,
            },
            items,
        };
    }
}
exports.KyselyFinancialReportingRepository = KyselyFinancialReportingRepository;
//# sourceMappingURL=reporting-financial.repository.js.map