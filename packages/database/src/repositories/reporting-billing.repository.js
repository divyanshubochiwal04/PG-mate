"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyBillingReportingRepository = void 0;
const kysely_1 = require("kysely");
const contracts_1 = require("@m-square/contracts");
class KyselyBillingReportingRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getBillingReport(organizationId, filter) {
        const page = filter.page && filter.page > 0 ? filter.page : 1;
        const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(page, pageSize);
        let query = this.db
            .selectFrom('invoices as inv')
            .innerJoin('residents as r', 'r.id', 'inv.resident_id')
            .leftJoin('stays as s', 's.id', 'inv.stay_id')
            .leftJoin('bed_allocations as ba', (join) => join.onRef('ba.stay_id', '=', 's.id').on('ba.status', '=', 'ACTIVE'))
            .leftJoin('beds as bd', 'bd.id', 'ba.bed_id')
            .leftJoin('rooms as rm', 'rm.id', 'bd.room_id')
            .leftJoin('floors as fl', 'fl.id', 'rm.floor_id')
            .leftJoin('buildings as b', 'b.id', 'fl.building_id')
            .leftJoin('properties as p', 'p.id', 'b.property_id')
            .where('inv.organization_id', '=', organizationId);
        if (filter.propertyId)
            query = query.where('p.id', '=', filter.propertyId);
        if (filter.buildingId)
            query = query.where('b.id', '=', filter.buildingId);
        if (filter.billingPeriod) {
            query = query.where((0, kysely_1.sql) `TO_CHAR(inv.billing_period_start, 'YYYY-MM')`, '=', filter.billingPeriod);
        }
        if (filter.fromDate) {
            query = query.where('inv.billing_period_start', '>=', filter.fromDate);
        }
        if (filter.toDate) {
            query = query.where('inv.billing_period_end', '<=', filter.toDate);
        }
        if (filter.search && filter.search.trim().length > 0) {
            const term = `%${filter.search.trim().toLowerCase()}%`;
            query = query.where((eb) => eb.or([
                eb('inv.invoice_number', 'ilike', term),
                eb('r.first_name', 'ilike', term),
                eb('r.last_name', 'ilike', term),
                eb('r.resident_code', 'ilike', term),
            ]));
        }
        const countRes = await query
            .select((0, kysely_1.sql) `COUNT(DISTINCT inv.id)::int`.as('total'))
            .executeTakeFirstOrThrow();
        const total = countRes.total || 0;
        const summaryRes = await query
            .select([
            (0, kysely_1.sql) `COALESCE(SUM(inv.total_amount), 0)::float`.as('totalInvoiced'),
            (0, kysely_1.sql) `COALESCE(SUM(inv.paid_amount), 0)::float`.as('totalCollected'),
            (0, kysely_1.sql) `COALESCE(SUM(inv.balance_due_amount), 0)::float`.as('totalOutstanding'),
            (0, kysely_1.sql) `COALESCE(SUM(CASE WHEN inv.status = 'OVERDUE' THEN inv.balance_due_amount ELSE 0 END), 0)::float`.as('overdueAmount'),
            (0, kysely_1.sql) `COUNT(CASE WHEN inv.status = 'PAID' THEN 1 END)::int`.as('paidInvoices'),
            (0, kysely_1.sql) `COUNT(CASE WHEN inv.status = 'PARTIALLY_PAID' THEN 1 END)::int`.as('partialInvoices'),
            (0, kysely_1.sql) `COUNT(CASE WHEN inv.status = 'ISSUED' THEN 1 END)::int`.as('unpaidInvoices'),
            (0, kysely_1.sql) `COUNT(CASE WHEN inv.status = 'CANCELLED' THEN 1 END)::int`.as('cancelledInvoices'),
        ])
            .executeTakeFirst();
        const rows = await query
            .select([
            'inv.id as invoiceId',
            'inv.invoice_number as invoiceNumber',
            'r.id as residentId',
            (0, kysely_1.sql) `CONCAT(r.first_name, ' ', r.last_name)`.as('residentName'),
            'r.resident_code as residentCode',
            'p.name as propertyName',
            'b.name as buildingName',
            (0, kysely_1.sql) `TO_CHAR(inv.billing_period_start, 'YYYY-MM')`.as('billingPeriod'),
            'inv.status as invoiceStatus',
            (0, kysely_1.sql) `inv.total_amount::float`.as('invoiceTotal'),
            (0, kysely_1.sql) `inv.paid_amount::float`.as('paidAmount'),
            (0, kysely_1.sql) `inv.balance_due_amount::float`.as('balanceDue'),
            'inv.due_date as dueDate',
        ])
            .orderBy('inv.created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .execute();
        const formattedRows = rows.map((r) => ({
            invoiceId: r.invoiceId,
            invoiceNumber: r.invoiceNumber,
            residentId: r.residentId,
            residentName: r.residentName,
            residentCode: r.residentCode,
            propertyName: r.propertyName || null,
            buildingName: r.buildingName || null,
            billingPeriod: r.billingPeriod || null,
            invoiceStatus: r.invoiceStatus,
            invoiceTotal: Number(r.invoiceTotal || 0),
            paidAmount: Number(r.paidAmount || 0),
            balanceDue: Number(r.balanceDue || 0),
            dueDate: new Date(r.dueDate).toISOString().split('T')[0],
        }));
        return {
            summary: {
                totalInvoiced: Number(summaryRes?.totalInvoiced || 0),
                totalCollected: Number(summaryRes?.totalCollected || 0),
                totalOutstanding: Number(summaryRes?.totalOutstanding || 0),
                overdueAmount: Number(summaryRes?.overdueAmount || 0),
                paidInvoices: Number(summaryRes?.paidInvoices || 0),
                partialInvoices: Number(summaryRes?.partialInvoices || 0),
                unpaidInvoices: Number(summaryRes?.unpaidInvoices || 0),
                cancelledInvoices: Number(summaryRes?.cancelledInvoices || 0),
            },
            rows: formattedRows,
            page,
            pageSize,
            total,
        };
    }
    async getCollectionReport(organizationId, filter) {
        const page = filter.page && filter.page > 0 ? filter.page : 1;
        const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(page, pageSize);
        let query = this.db
            .selectFrom('payments as pay')
            .innerJoin('residents as r', 'r.id', 'pay.resident_id')
            .leftJoin('receipts as rec', 'rec.payment_id', 'pay.id')
            .leftJoin('payment_allocations as pa', 'pa.payment_id', 'pay.id')
            .leftJoin('invoices as inv', 'inv.id', 'pa.invoice_id')
            .where('pay.organization_id', '=', organizationId);
        if (filter.fromDate) {
            query = query.where('pay.payment_date', '>=', filter.fromDate);
        }
        if (filter.toDate) {
            query = query.where('pay.payment_date', '<=', filter.toDate);
        }
        if (filter.search && filter.search.trim().length > 0) {
            const term = `%${filter.search.trim().toLowerCase()}%`;
            query = query.where((eb) => eb.or([
                eb('pay.payment_number', 'ilike', term),
                eb('rec.receipt_number', 'ilike', term),
                eb('r.first_name', 'ilike', term),
                eb('r.last_name', 'ilike', term),
                eb('r.resident_code', 'ilike', term),
            ]));
        }
        const countRes = await query
            .select((0, kysely_1.sql) `COUNT(DISTINCT pay.id)::int`.as('total'))
            .executeTakeFirstOrThrow();
        const total = countRes.total || 0;
        const summaryRes = await query
            .select([
            (0, kysely_1.sql) `COALESCE(SUM(pay.amount), 0)::float`.as('totalCollected'),
            (0, kysely_1.sql) `COUNT(DISTINCT pay.id)::int`.as('paymentCount'),
            (0, kysely_1.sql) `COALESCE(SUM(CASE WHEN pay.payment_method = 'CASH' THEN pay.amount ELSE 0 END), 0)::float`.as('cashCollected'),
            (0, kysely_1.sql) `COALESCE(SUM(CASE WHEN pay.payment_method = 'UPI' THEN pay.amount ELSE 0 END), 0)::float`.as('upiCollected'),
            (0, kysely_1.sql) `COALESCE(SUM(CASE WHEN pay.payment_method = 'BANK_TRANSFER' THEN pay.amount ELSE 0 END), 0)::float`.as('bankTransferCollected'),
            (0, kysely_1.sql) `COALESCE(SUM(CASE WHEN pay.payment_method NOT IN ('CASH', 'UPI', 'BANK_TRANSFER') THEN pay.amount ELSE 0 END), 0)::float`.as('otherCollected'),
        ])
            .executeTakeFirst();
        const rows = await query
            .select([
            'pay.id as paymentId',
            'rec.id as receiptId',
            'rec.receipt_number as receiptNumber',
            'r.id as residentId',
            (0, kysely_1.sql) `CONCAT(r.first_name, ' ', r.last_name)`.as('residentName'),
            'r.resident_code as residentCode',
            'inv.id as invoiceId',
            'inv.invoice_number as invoiceNumber',
            (0, kysely_1.sql) `pay.amount::float`.as('amount'),
            'pay.payment_method as paymentMethod',
            'pay.reference_number as reference',
            'pay.payment_date as paymentDate',
            'pay.status as status',
        ])
            .orderBy('pay.created_at', 'desc')
            .offset(offset)
            .limit(limit)
            .execute();
        const formattedRows = rows.map((r) => ({
            paymentId: r.paymentId,
            receiptId: r.receiptId || null,
            receiptNumber: r.receiptNumber || null,
            residentId: r.residentId,
            residentName: r.residentName,
            residentCode: r.residentCode,
            invoiceId: r.invoiceId || null,
            invoiceNumber: r.invoiceNumber || null,
            amount: Number(r.amount || 0),
            paymentMethod: r.paymentMethod,
            reference: r.reference || null,
            paymentDate: new Date(r.paymentDate).toISOString().split('T')[0],
            status: r.status,
        }));
        return {
            summary: {
                totalCollected: Number(summaryRes?.totalCollected || 0),
                paymentCount: Number(summaryRes?.paymentCount || 0),
                cashCollected: Number(summaryRes?.cashCollected || 0),
                upiCollected: Number(summaryRes?.upiCollected || 0),
                bankTransferCollected: Number(summaryRes?.bankTransferCollected || 0),
                otherCollected: Number(summaryRes?.otherCollected || 0),
            },
            rows: formattedRows,
            page,
            pageSize,
            total,
        };
    }
    async getOutstandingReport(organizationId, filter) {
        const page = filter.page && filter.page > 0 ? filter.page : 1;
        const pageSize = filter.pageSize && filter.pageSize > 0 ? Math.min(filter.pageSize, 100) : 10;
        const { offset, limit } = (0, contracts_1.calculatePaginationBounds)(page, pageSize);
        let query = this.db
            .selectFrom('residents as r')
            .innerJoin('invoices as inv', 'inv.resident_id', 'r.id')
            .leftJoin('stays as s', (join) => join.onRef('s.resident_id', '=', 'r.id').on('s.status', '=', 'ACTIVE'))
            .leftJoin('bed_allocations as ba', (join) => join.onRef('ba.stay_id', '=', 's.id').on('ba.status', '=', 'ACTIVE'))
            .leftJoin('beds as bd', 'bd.id', 'ba.bed_id')
            .leftJoin('rooms as rm', 'rm.id', 'bd.room_id')
            .leftJoin('floors as fl', 'fl.id', 'rm.floor_id')
            .leftJoin('buildings as b', 'b.id', 'fl.building_id')
            .leftJoin('properties as p', 'p.id', 'b.property_id')
            .where('r.organization_id', '=', organizationId)
            .where('inv.status', 'in', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
            .where('inv.balance_due_amount', '>', 0);
        if (filter.propertyId)
            query = query.where('p.id', '=', filter.propertyId);
        if (filter.buildingId)
            query = query.where('b.id', '=', filter.buildingId);
        const groupQuery = query.select([
            'r.id as residentId',
            'r.resident_code as residentCode',
            (0, kysely_1.sql) `CONCAT(r.first_name, ' ', r.last_name)`.as('residentName'),
            'r.phone as phone',
            'p.name as propertyName',
            'b.name as buildingName',
            'rm.room_number as roomNumber',
            'bd.bed_number as bedNumber',
            (0, kysely_1.sql) `COUNT(inv.id)::int`.as('invoiceCount'),
            (0, kysely_1.sql) `SUM(inv.total_amount)::float`.as('totalInvoiced'),
            (0, kysely_1.sql) `SUM(inv.paid_amount)::float`.as('totalPaid'),
            (0, kysely_1.sql) `SUM(inv.balance_due_amount)::float`.as('balanceDue'),
            (0, kysely_1.sql) `MIN(inv.due_date)`.as('oldestDueDate'),
            (0, kysely_1.sql) `MAX(CURRENT_DATE - inv.due_date::date)::int`.as('daysOutstanding'),
        ]).groupBy([
            'r.id',
            'r.resident_code',
            'r.first_name',
            'r.last_name',
            'r.phone',
            'p.name',
            'b.name',
            'rm.room_number',
            'bd.bed_number',
        ]);
        const rowsAll = await groupQuery.execute();
        const total = rowsAll.length;
        let totalOutstandingAmount = 0;
        for (const r of rowsAll) {
            totalOutstandingAmount += Number(r.balanceDue || 0);
        }
        const rows = await groupQuery
            .orderBy('balanceDue', 'desc')
            .orderBy('oldestDueDate', 'asc')
            .orderBy('residentName', 'asc')
            .offset(offset)
            .limit(limit)
            .execute();
        const formattedRows = rows.map((r) => ({
            residentId: r.residentId,
            residentCode: r.residentCode,
            residentName: r.residentName,
            phone: r.phone || null,
            propertyName: r.propertyName || null,
            buildingName: r.buildingName || null,
            roomNumber: r.roomNumber || null,
            bedNumber: r.bedNumber || null,
            invoiceCount: Number(r.invoiceCount || 0),
            totalInvoiced: Number(r.totalInvoiced || 0),
            totalPaid: Number(r.totalPaid || 0),
            balanceDue: Number(r.balanceDue || 0),
            oldestDueDate: r.oldestDueDate ? new Date(r.oldestDueDate).toISOString().split('T')[0] : null,
            daysOutstanding: Math.max(0, Number(r.daysOutstanding || 0)),
        }));
        return {
            summary: {
                totalOutstandingAmount,
                totalResidentsWithDues: total,
                totalOverdueInvoices: total,
            },
            rows: formattedRows,
            page,
            pageSize,
            total,
        };
    }
}
exports.KyselyBillingReportingRepository = KyselyBillingReportingRepository;
//# sourceMappingURL=reporting-billing.repository.js.map