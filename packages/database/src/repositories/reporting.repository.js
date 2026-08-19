"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyReportingRepository = void 0;
const kysely_1 = require("kysely");
__exportStar(require("./reporting-query-types"), exports);
class KyselyReportingRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getOccupancyMetrics(organizationId, propertyId, buildingId) {
        let propQuery = this.db
            .selectFrom('properties')
            .select((0, kysely_1.sql) `COUNT(id)::int`.as('count'))
            .where('organization_id', '=', organizationId);
        if (propertyId)
            propQuery = propQuery.where('id', '=', propertyId);
        const propRes = await propQuery.executeTakeFirst();
        const totalProperties = propRes?.count || 0;
        let bldgQuery = this.db
            .selectFrom('buildings')
            .select((0, kysely_1.sql) `COUNT(id)::int`.as('count'))
            .where('organization_id', '=', organizationId);
        if (propertyId)
            bldgQuery = bldgQuery.where('property_id', '=', propertyId);
        if (buildingId)
            bldgQuery = bldgQuery.where('id', '=', buildingId);
        const bldgRes = await bldgQuery.executeTakeFirst();
        const totalBuildings = bldgRes?.count || 0;
        let flrQuery = this.db
            .selectFrom('floors as f')
            .innerJoin('buildings as b', 'b.id', 'f.building_id')
            .select((0, kysely_1.sql) `COUNT(f.id)::int`.as('count'))
            .where('f.organization_id', '=', organizationId);
        if (propertyId)
            flrQuery = flrQuery.where('b.property_id', '=', propertyId);
        if (buildingId)
            flrQuery = flrQuery.where('b.id', '=', buildingId);
        const flrRes = await flrQuery.executeTakeFirst();
        const totalFloors = flrRes?.count || 0;
        let rmQuery = this.db
            .selectFrom('rooms as r')
            .innerJoin('floors as f', 'f.id', 'r.floor_id')
            .innerJoin('buildings as b', 'b.id', 'f.building_id')
            .select((0, kysely_1.sql) `COUNT(r.id)::int`.as('count'))
            .where('r.organization_id', '=', organizationId);
        if (propertyId)
            rmQuery = rmQuery.where('b.property_id', '=', propertyId);
        if (buildingId)
            rmQuery = rmQuery.where('b.id', '=', buildingId);
        const rmRes = await rmQuery.executeTakeFirst();
        const totalRooms = rmRes?.count || 0;
        let bedsBaseQuery = this.db
            .selectFrom('beds as bd')
            .innerJoin('rooms as r', 'r.id', 'bd.room_id')
            .innerJoin('floors as f', 'f.id', 'r.floor_id')
            .innerJoin('buildings as b', 'b.id', 'f.building_id')
            .where('bd.organization_id', '=', organizationId);
        if (propertyId)
            bedsBaseQuery = bedsBaseQuery.where('b.property_id', '=', propertyId);
        if (buildingId)
            bedsBaseQuery = bedsBaseQuery.where('b.id', '=', buildingId);
        const bedsStatusRes = await bedsBaseQuery
            .select(['bd.status as status', (0, kysely_1.sql) `COUNT(bd.id)::int`.as('count')])
            .groupBy('bd.status')
            .execute();
        let totalBeds = 0;
        let maintenanceBeds = 0;
        let inactiveBeds = 0;
        for (const r of bedsStatusRes) {
            const cnt = Number(r.count || 0);
            totalBeds += cnt;
            if (r.status === 'MAINTENANCE')
                maintenanceBeds += cnt;
            if (r.status === 'INACTIVE')
                inactiveBeds += cnt;
        }
        let activeAllocQuery = this.db
            .selectFrom('bed_allocations as ba')
            .innerJoin('beds as bd', 'bd.id', 'ba.bed_id')
            .innerJoin('rooms as r', 'r.id', 'bd.room_id')
            .innerJoin('floors as f', 'f.id', 'r.floor_id')
            .innerJoin('buildings as b', 'b.id', 'f.building_id')
            .select((0, kysely_1.sql) `COUNT(DISTINCT ba.bed_id)::int`.as('count'))
            .where('ba.organization_id', '=', organizationId)
            .where('ba.status', '=', 'ACTIVE');
        if (propertyId)
            activeAllocQuery = activeAllocQuery.where('b.property_id', '=', propertyId);
        if (buildingId)
            activeAllocQuery = activeAllocQuery.where('b.id', '=', buildingId);
        const activeAllocRes = await activeAllocQuery.executeTakeFirst();
        const occupiedBeds = activeAllocRes?.count || 0;
        const availableBeds = Math.max(0, totalBeds - occupiedBeds - maintenanceBeds - inactiveBeds);
        const capacityForOccupancy = totalBeds - maintenanceBeds - inactiveBeds;
        const occupancyPercentage = capacityForOccupancy > 0
            ? Math.round((occupiedBeds / capacityForOccupancy) * 10000) / 100
            : 0;
        return {
            totalProperties,
            totalBuildings,
            totalFloors,
            totalRooms,
            totalBeds,
            availableBeds,
            occupiedBeds,
            maintenanceBeds,
            inactiveBeds,
            occupancyPercentage,
        };
    }
    async getResidentMetrics(organizationId, propertyId, buildingId, startDate, endDate) {
        const resStatusQuery = this.db
            .selectFrom('residents')
            .select(['status', (0, kysely_1.sql) `COUNT(id)::int`.as('count')])
            .where('organization_id', '=', organizationId)
            .groupBy('status');
        const resStatus = await resStatusQuery.execute();
        let totalActiveResidents = 0;
        let totalInactiveResidents = 0;
        for (const r of resStatus) {
            if (r.status === 'ACTIVE')
                totalActiveResidents = Number(r.count);
            if (r.status === 'INACTIVE')
                totalInactiveResidents = Number(r.count);
        }
        // Active residents without stay
        const noStayRes = await this.db
            .selectFrom('residents as r')
            .select((0, kysely_1.sql) `COUNT(r.id)::int`.as('count'))
            .where('r.organization_id', '=', organizationId)
            .where('r.status', '=', 'ACTIVE')
            .where((eb) => eb.not(eb.exists(eb
            .selectFrom('stays as s')
            .select('s.id')
            .whereRef('s.resident_id', '=', 'r.id')
            .where('s.status', '=', 'ACTIVE'))))
            .executeTakeFirst();
        const residentsWithoutStay = noStayRes?.count || 0;
        let staysBase = this.db
            .selectFrom('stays as s')
            .where('s.organization_id', '=', organizationId);
        if (propertyId || buildingId) {
            staysBase = staysBase
                .innerJoin('bed_allocations as ba', 'ba.stay_id', 's.id')
                .innerJoin('beds as bd', 'bd.id', 'ba.bed_id')
                .innerJoin('rooms as r', 'r.id', 'bd.room_id')
                .innerJoin('floors as f', 'f.id', 'r.floor_id')
                .innerJoin('buildings as b', 'b.id', 'f.building_id');
            if (propertyId)
                staysBase = staysBase.where('b.property_id', '=', propertyId);
            if (buildingId)
                staysBase = staysBase.where('b.id', '=', buildingId);
        }
        const currentCheckedInRes = await staysBase
            .select((0, kysely_1.sql) `COUNT(DISTINCT s.resident_id)::int`.as('count'))
            .where('s.status', '=', 'ACTIVE')
            .executeTakeFirst();
        const currentCheckedInResidents = currentCheckedInRes?.count || 0;
        const checkedOutRes = await staysBase
            .select((0, kysely_1.sql) `COUNT(DISTINCT s.resident_id)::int`.as('count'))
            .where('s.status', 'in', ['COMPLETED', 'CHECKED_OUT'])
            .executeTakeFirst();
        const checkedOutResidents = checkedOutRes?.count || 0;
        let admissionsQuery = staysBase.select((0, kysely_1.sql) `COUNT(DISTINCT s.id)::int`.as('count'));
        if (startDate)
            admissionsQuery = admissionsQuery.where('s.admission_date', '>=', new Date(startDate));
        if (endDate)
            admissionsQuery = admissionsQuery.where('s.admission_date', '<=', new Date(endDate));
        const admissionsRes = await admissionsQuery.executeTakeFirst();
        const newAdmissionsInPeriod = admissionsRes?.count || 0;
        let checkoutsQuery = staysBase
            .select((0, kysely_1.sql) `COUNT(DISTINCT s.id)::int`.as('count'))
            .where('s.status', 'in', ['COMPLETED', 'CHECKED_OUT']);
        if (startDate)
            checkoutsQuery = checkoutsQuery.where('s.actual_checkout_date', '>=', new Date(startDate));
        if (endDate)
            checkoutsQuery = checkoutsQuery.where('s.actual_checkout_date', '<=', new Date(endDate));
        const checkoutsRes = await checkoutsQuery.executeTakeFirst();
        const checkoutsInPeriod = checkoutsRes?.count || 0;
        let transfersQuery = this.db
            .selectFrom('bed_allocations as ba')
            .select((0, kysely_1.sql) `COUNT(ba.id)::int`.as('count'))
            .where('ba.organization_id', '=', organizationId)
            .where('ba.status', '=', 'TRANSFERRED');
        if (startDate)
            transfersQuery = transfersQuery.where('ba.created_at', '>=', new Date(startDate));
        if (endDate)
            transfersQuery = transfersQuery.where('ba.created_at', '<=', new Date(endDate));
        const transfersRes = await transfersQuery.executeTakeFirst();
        const transfersInPeriod = transfersRes?.count || 0;
        return {
            totalActiveResidents,
            totalInactiveResidents,
            currentCheckedInResidents,
            checkedOutResidents,
            residentsWithoutStay,
            newAdmissionsInPeriod,
            checkoutsInPeriod,
            transfersInPeriod,
        };
    }
    async getBillingMetrics(organizationId, propertyId, buildingId, startDate, endDate) {
        let invQuery = this.db
            .selectFrom('invoices')
            .where('organization_id', '=', organizationId)
            .where('status', '!=', 'CANCELLED');
        if (startDate)
            invQuery = invQuery.where('issued_at', '>=', new Date(startDate));
        if (endDate)
            invQuery = invQuery.where('issued_at', '<=', new Date(endDate));
        const invSummary = await invQuery
            .select([
            (0, kysely_1.sql) `COALESCE(SUM(ROUND(total_amount * 100)), 0)::bigint`.as('totalInvoiced'),
            (0, kysely_1.sql) `COALESCE(SUM(ROUND(paid_amount * 100)), 0)::bigint`.as('totalCollected'),
            (0, kysely_1.sql) `COALESCE(SUM(ROUND(balance_due_amount * 100)), 0)::bigint`.as('totalOutstanding'),
            (0, kysely_1.sql) `COALESCE(SUM(CASE WHEN status = 'OVERDUE' THEN ROUND(balance_due_amount * 100) ELSE 0 END), 0)::bigint`.as('overdueAmount'),
            (0, kysely_1.sql) `COALESCE(SUM(CASE WHEN status = 'PARTIALLY_PAID' THEN ROUND(balance_due_amount * 100) ELSE 0 END), 0)::bigint`.as('partiallyPaidAmount'),
            (0, kysely_1.sql) `COUNT(CASE WHEN status = 'PAID' THEN 1 END)::int`.as('paidCount'),
            (0, kysely_1.sql) `COUNT(CASE WHEN status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE') THEN 1 END)::int`.as('unpaidCount'),
            (0, kysely_1.sql) `COUNT(CASE WHEN status = 'OVERDUE' THEN 1 END)::int`.as('overdueCount'),
        ])
            .executeTakeFirst();
        const totalInvoicedPaise = Number(invSummary?.totalInvoiced || 0);
        const totalCollectedPaise = Number(invSummary?.totalCollected || 0);
        const totalOutstandingPaise = Number(invSummary?.totalOutstanding || 0);
        const overdueAmountPaise = Number(invSummary?.overdueAmount || 0);
        const partiallyPaidAmountPaise = Number(invSummary?.partiallyPaidAmount || 0);
        const paidInvoiceCount = Number(invSummary?.paidCount || 0);
        const unpaidInvoiceCount = Number(invSummary?.unpaidCount || 0);
        const overdueInvoiceCount = Number(invSummary?.overdueCount || 0);
        const collectionPercentage = totalInvoicedPaise > 0
            ? Math.round((totalCollectedPaise / totalInvoicedPaise) * 10000) / 100
            : 0;
        return {
            totalInvoicedPaise,
            totalCollectedPaise,
            totalOutstandingPaise,
            overdueAmountPaise,
            partiallyPaidAmountPaise,
            paidInvoiceCount,
            unpaidInvoiceCount,
            overdueInvoiceCount,
            collectionPercentage,
        };
    }
    async getMessMetrics(organizationId, propertyId, buildingId, startDate, endDate) {
        const subRes = await this.db
            .selectFrom('resident_mess_subscriptions')
            .select((0, kysely_1.sql) `COUNT(id)::int`.as('count'))
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'ACTIVE')
            .executeTakeFirst();
        const activeMessSubscribers = subRes?.count || 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const mealsToday = await this.db
            .selectFrom('mess_meal_consumptions')
            .select(['status', (0, kysely_1.sql) `COUNT(id)::int`.as('count')])
            .where('organization_id', '=', organizationId)
            .where('consumption_date', '=', todayStr)
            .groupBy('status')
            .execute();
        let mealsConsumedToday = 0;
        let mealsSkippedToday = 0;
        for (const m of mealsToday) {
            if (m.status === 'CONSUMED')
                mealsConsumedToday = Number(m.count);
            if (m.status === 'SKIPPED' || m.status === 'CANCELLED')
                mealsSkippedToday += Number(m.count);
        }
        const expectedMealsToday = activeMessSubscribers * 3;
        const consumptionPercentage = expectedMealsToday > 0
            ? Math.round((mealsConsumedToday / expectedMealsToday) * 10000) / 100
            : 0;
        const invRes = await this.db
            .selectFrom('mess_inventory_items')
            .select([
            (0, kysely_1.sql) `COUNT(id)::int`.as('totalCount'),
            (0, kysely_1.sql) `COALESCE(SUM(ROUND(current_stock * 0 * 100)), 0)::bigint`.as('totalValue'),
            (0, kysely_1.sql) `COUNT(CASE WHEN current_stock <= reorder_level AND current_stock > 0 THEN 1 END)::int`.as('lowStock'),
            (0, kysely_1.sql) `COUNT(CASE WHEN current_stock <= 0 THEN 1 END)::int`.as('outOfStock'),
        ])
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        const totalInventoryItems = Number(invRes?.totalCount || 0);
        const currentInventoryValuePaise = Number(invRes?.totalValue || 0);
        const lowStockItemCount = Number(invRes?.lowStock || 0);
        const outOfStockItemCount = Number(invRes?.outOfStock || 0);
        let procQuery = this.db
            .selectFrom('mess_procurements')
            .select((0, kysely_1.sql) `COALESCE(SUM(ROUND(total_amount * 100)), 0)::bigint`.as('total'))
            .where('organization_id', '=', organizationId);
        if (startDate)
            procQuery = procQuery.where('created_at', '>=', new Date(startDate));
        if (endDate)
            procQuery = procQuery.where('created_at', '<=', new Date(endDate));
        const procRes = await procQuery.executeTakeFirst();
        const currentMonthProcurementPaise = Number(procRes?.total || 0);
        let expQuery = this.db
            .selectFrom('mess_expenses')
            .select((0, kysely_1.sql) `COALESCE(SUM(ROUND(amount * 100)), 0)::bigint`.as('total'))
            .where('organization_id', '=', organizationId);
        if (startDate)
            expQuery = expQuery.where('created_at', '>=', new Date(startDate));
        if (endDate)
            expQuery = expQuery.where('created_at', '<=', new Date(endDate));
        const expRes = await expQuery.executeTakeFirst();
        const currentMonthMessExpensePaise = Number(expRes?.total || 0);
        return {
            activeMessSubscribers,
            expectedMealsToday,
            mealsConsumedToday,
            mealsSkippedToday,
            consumptionPercentage,
            currentInventoryValuePaise,
            totalInventoryItems,
            lowStockItemCount,
            outOfStockItemCount,
            currentMonthProcurementPaise,
            currentMonthMessExpensePaise,
        };
    }
    async getExpenseMetrics(organizationId, propertyId, buildingId, startDate, endDate) {
        let messExpQuery = this.db
            .selectFrom('mess_expenses')
            .select((0, kysely_1.sql) `COALESCE(SUM(ROUND(amount * 100)), 0)::bigint`.as('total'))
            .where('organization_id', '=', organizationId);
        if (startDate)
            messExpQuery = messExpQuery.where('created_at', '>=', new Date(startDate));
        if (endDate)
            messExpQuery = messExpQuery.where('created_at', '<=', new Date(endDate));
        const messExpRes = await messExpQuery.executeTakeFirst();
        const messExpensesPaise = Number(messExpRes?.total || 0);
        const maintenanceExpensesPaise = 0;
        const utilitiesExpensesPaise = 0;
        const otherExpensesPaise = 0;
        const currentMonthExpensesPaise = messExpensesPaise;
        // Previous month expenses query
        let prevMessExpQuery = this.db
            .selectFrom('mess_expenses')
            .select((0, kysely_1.sql) `COALESCE(SUM(ROUND(amount * 100)), 0)::bigint`.as('total'))
            .where('organization_id', '=', organizationId);
        if (startDate) {
            const prevStart = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() - 1)).toISOString();
            const prevEnd = new Date(startDate).toISOString();
            prevMessExpQuery = prevMessExpQuery.where('created_at', '>=', new Date(prevStart)).where('created_at', '<', new Date(prevEnd));
        }
        const prevMessExpRes = await prevMessExpQuery.executeTakeFirst();
        const previousMonthExpensesPaise = Number(prevMessExpRes?.total || 0);
        const categories = [
            { category: 'MESS', amountPaise: messExpensesPaise },
        ];
        return {
            currentMonthExpensesPaise,
            previousMonthExpensesPaise,
            messExpensesPaise,
            maintenanceExpensesPaise,
            utilitiesExpensesPaise,
            otherExpensesPaise,
            categories,
        };
    }
    async getRecentActivity(organizationId, propertyId, buildingId, limit = 20) {
        const items = [];
        const payments = await this.db
            .selectFrom('payments')
            .select(['id', 'payment_number', 'amount', 'created_at'])
            .where('organization_id', '=', organizationId)
            .orderBy('created_at', 'desc')
            .limit(limit)
            .execute();
        for (const p of payments) {
            items.push({
                id: `pay-${p.id}`,
                type: 'PAYMENT_COLLECTED',
                title: `Payment Collected (${p.payment_number})`,
                description: `Collected ₹${Number(p.amount).toLocaleString('en-IN')}`,
                timestamp: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
                entityId: p.id,
            });
        }
        const invoices = await this.db
            .selectFrom('invoices')
            .select(['id', 'invoice_number', 'total_amount', 'created_at'])
            .where('organization_id', '=', organizationId)
            .orderBy('created_at', 'desc')
            .limit(limit)
            .execute();
        for (const inv of invoices) {
            items.push({
                id: `inv-${inv.id}`,
                type: 'INVOICE_GENERATED',
                title: `Invoice Issued (${inv.invoice_number})`,
                description: `Invoice amount ₹${Number(inv.total_amount).toLocaleString('en-IN')}`,
                timestamp: inv.created_at
                    ? new Date(inv.created_at).toISOString()
                    : new Date().toISOString(),
                entityId: inv.id,
            });
        }
        const residents = await this.db
            .selectFrom('residents')
            .select(['id', 'first_name', 'last_name', 'resident_code', 'created_at'])
            .where('organization_id', '=', organizationId)
            .orderBy('created_at', 'desc')
            .limit(limit)
            .execute();
        for (const r of residents) {
            items.push({
                id: `res-${r.id}`,
                type: 'RESIDENT_REGISTERED',
                title: `Resident Registered (${r.resident_code})`,
                description: `${r.first_name} ${r.last_name}`,
                timestamp: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
                entityId: r.id,
            });
        }
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return items.slice(0, limit);
    }
    async getOperationalAlerts(organizationId, propertyId, buildingId) {
        const alerts = [];
        // Low stock items alert
        const lowStockRes = await this.db
            .selectFrom('mess_inventory_items')
            .select((0, kysely_1.sql) `COUNT(id)::int`.as('count'))
            .where('organization_id', '=', organizationId)
            .where((eb) => eb.and([eb('current_stock', '<=', eb.ref('reorder_level')), eb('current_stock', '>', 0)]))
            .executeTakeFirst();
        const lowStockCount = lowStockRes?.count || 0;
        if (lowStockCount > 0) {
            alerts.push({
                id: 'alert-low-stock',
                type: 'LOW_STOCK',
                severity: 'WARNING',
                title: 'Low Stock Warning',
                description: `${lowStockCount} kitchen inventory items are below reorder level`,
                count: lowStockCount,
                targetScreen: '/(owner)/inventory',
            });
        }
        // Out of stock items alert
        const outOfStockRes = await this.db
            .selectFrom('mess_inventory_items')
            .select((0, kysely_1.sql) `COUNT(id)::int`.as('count'))
            .where('organization_id', '=', organizationId)
            .where('current_stock', '<=', 0)
            .executeTakeFirst();
        const outOfStockCount = outOfStockRes?.count || 0;
        if (outOfStockCount > 0) {
            alerts.push({
                id: 'alert-out-of-stock',
                type: 'OUT_OF_STOCK',
                severity: 'CRITICAL',
                title: 'Out of Stock Alert',
                description: `${outOfStockCount} kitchen inventory items are completely out of stock`,
                count: outOfStockCount,
                targetScreen: '/(owner)/inventory',
            });
        }
        // Overdue invoices alert
        const overdueRes = await this.db
            .selectFrom('invoices')
            .select((0, kysely_1.sql) `COUNT(id)::int`.as('count'))
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'OVERDUE')
            .executeTakeFirst();
        const overdueCount = overdueRes?.count || 0;
        if (overdueCount > 0) {
            alerts.push({
                id: 'alert-overdue-invoices',
                type: 'OUTSTANDING_DUES',
                severity: 'WARNING',
                title: 'Outstanding Dues Warning',
                description: `${overdueCount} invoices have overdue balances pending collection`,
                count: overdueCount,
                targetScreen: '/(owner)/billing',
            });
        }
        // Residents without stay alert
        const noStayRes = await this.db
            .selectFrom('residents as r')
            .select((0, kysely_1.sql) `COUNT(r.id)::int`.as('count'))
            .where('r.organization_id', '=', organizationId)
            .where('r.status', '=', 'ACTIVE')
            .where((eb) => eb.not(eb.exists(eb
            .selectFrom('stays as s')
            .select('s.id')
            .whereRef('s.resident_id', '=', 'r.id')
            .where('s.status', '=', 'ACTIVE'))))
            .executeTakeFirst();
        const noStayCount = noStayRes?.count || 0;
        if (noStayCount > 0) {
            alerts.push({
                id: 'alert-no-stay',
                type: 'NO_STAY',
                severity: 'WARNING',
                title: 'Residents Without Stay',
                description: `${noStayCount} active residents require bed check-in allocation`,
                count: noStayCount,
                targetScreen: '/(owner)/residents',
            });
        }
        // High occupancy alert
        const occupancy = await this.getOccupancyMetrics(organizationId, propertyId, buildingId);
        if (occupancy.occupancyPercentage >= 90 && occupancy.totalBeds > 0) {
            alerts.push({
                id: 'alert-high-occupancy',
                type: 'HIGH_OCCUPANCY',
                severity: 'INFO',
                title: 'High Occupancy Level',
                description: `Facility is operating at ${occupancy.occupancyPercentage}% bed occupancy`,
                count: Math.round(occupancy.occupancyPercentage),
                targetScreen: '/(owner)/reports/occupancy',
            });
        }
        return alerts;
    }
}
exports.KyselyReportingRepository = KyselyReportingRepository;
//# sourceMappingURL=reporting.repository.js.map