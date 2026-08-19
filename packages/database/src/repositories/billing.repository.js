"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyBillingRepository = void 0;
const kysely_1 = require("kysely");
class KyselyBillingRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getExecutor(trx) {
        return trx && typeof trx.selectFrom === 'function'
            ? trx
            : this.db;
    }
    // --- CONFIG ---
    async getConfig(organizationId, trx) {
        const executor = this.getExecutor(trx);
        if (!executor || typeof executor.selectFrom !== 'function') {
            return null;
        }
        const row = await executor
            .selectFrom('billing_configurations')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async upsertConfig(organizationId, data, trx) {
        const existing = await this.getConfig(organizationId, trx);
        if (existing) {
            return await this.getExecutor(trx)
                .updateTable('billing_configurations')
                .set({
                grace_period_days: data.gracePeriodDays ?? existing.grace_period_days,
                late_fee_per_day: data.lateFeePerDay ?? existing.late_fee_per_day,
                default_billing_cycle: data.defaultBillingCycle || existing.default_billing_cycle,
                updated_at: new Date(),
            })
                .where('id', '=', existing.id)
                .where('organization_id', '=', organizationId)
                .returningAll()
                .executeTakeFirstOrThrow();
        }
        return await this.getExecutor(trx)
            .insertInto('billing_configurations')
            .values({
            organization_id: organizationId,
            grace_period_days: data.gracePeriodDays ?? 5,
            late_fee_per_day: data.lateFeePerDay ?? 100,
            default_billing_cycle: data.defaultBillingCycle || 'JOINING_DATE',
        })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    // --- INVOICES ---
    async createInvoice(data, trx) {
        return await this.getExecutor(trx)
            .insertInto('invoices')
            .values({
            organization_id: data.organization_id,
            resident_id: data.resident_id,
            stay_id: data.stay_id,
            invoice_number: data.invoice_number,
            billing_period_start: data.billing_period_start,
            billing_period_end: data.billing_period_end,
            due_date: data.due_date,
            subtotal_amount: data.subtotal_amount,
            discount_amount: data.discount_amount ?? 0,
            tax_amount: data.tax_amount ?? 0,
            total_amount: data.total_amount,
            paid_amount: data.paid_amount ?? 0,
            balance_due_amount: data.balance_due_amount,
            status: data.status || 'ISSUED',
        })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async findInvoiceById(id, organizationId, trx) {
        const row = await this.getExecutor(trx)
            .selectFrom('invoices')
            .innerJoin('residents', 'residents.id', 'invoices.resident_id')
            .select([
            'invoices.id',
            'invoices.organization_id',
            'invoices.resident_id',
            'invoices.stay_id',
            'invoices.invoice_number',
            'invoices.billing_period_start',
            'invoices.billing_period_end',
            'invoices.due_date',
            'invoices.subtotal_amount',
            'invoices.discount_amount',
            'invoices.tax_amount',
            'invoices.total_amount',
            'invoices.paid_amount',
            'invoices.balance_due_amount',
            'invoices.status',
            'invoices.issued_at',
            'invoices.cancelled_at',
            'invoices.created_at',
            'invoices.updated_at',
            (0, kysely_1.sql) `concat(residents.first_name, ' ', residents.last_name)`.as('residentName'),
            'residents.resident_code as residentCode',
        ])
            .where('invoices.id', '=', id)
            .where('invoices.organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findInvoicesByOrganization(organizationId, options, trx) {
        const page = options?.page || 1;
        const pageSize = options?.pageSize || 20;
        let baseQuery = this.getExecutor(trx)
            .selectFrom('invoices')
            .innerJoin('residents', 'residents.id', 'invoices.resident_id')
            .where('invoices.organization_id', '=', organizationId);
        if (options?.status) {
            baseQuery = baseQuery.where('invoices.status', '=', options.status);
        }
        if (options?.residentId) {
            baseQuery = baseQuery.where('invoices.resident_id', '=', options.residentId);
        }
        if (options?.stayId) {
            baseQuery = baseQuery.where('invoices.stay_id', '=', options.stayId);
        }
        if (options?.billingPeriod) {
            baseQuery = baseQuery.where((0, kysely_1.sql) `TO_CHAR(invoices.billing_period_start, 'YYYY-MM') = ${options.billingPeriod}`);
        }
        if (options?.search) {
            const searchTerm = `%${options.search}%`;
            baseQuery = baseQuery.where((eb) => eb.or([
                eb('invoices.invoice_number', 'ilike', searchTerm),
                eb('residents.first_name', 'ilike', searchTerm),
                eb('residents.last_name', 'ilike', searchTerm),
                eb('residents.resident_code', 'ilike', searchTerm),
                eb('residents.phone', 'ilike', searchTerm),
            ]));
        }
        if (options?.propertyId || options?.buildingId) {
            baseQuery = baseQuery
                .innerJoin('bed_allocations', 'bed_allocations.stay_id', 'invoices.stay_id')
                .innerJoin('beds', 'beds.id', 'bed_allocations.bed_id')
                .innerJoin('rooms', 'rooms.id', 'beds.room_id')
                .innerJoin('floors', 'floors.id', 'rooms.floor_id')
                .innerJoin('buildings', 'buildings.id', 'floors.building_id');
            if (options.buildingId) {
                baseQuery = baseQuery.where('buildings.id', '=', options.buildingId);
            }
            if (options.propertyId) {
                baseQuery = baseQuery.where('buildings.property_id', '=', options.propertyId);
            }
        }
        const countRes = await baseQuery
            .select((0, kysely_1.sql) `count(distinct invoices.id)::int`.as('count'))
            .executeTakeFirst();
        const total = countRes?.count || 0;
        const rows = await baseQuery
            .select([
            'invoices.id',
            'invoices.organization_id',
            'invoices.resident_id',
            'invoices.stay_id',
            'invoices.invoice_number',
            'invoices.billing_period_start',
            'invoices.billing_period_end',
            'invoices.due_date',
            'invoices.subtotal_amount',
            'invoices.discount_amount',
            'invoices.tax_amount',
            'invoices.total_amount',
            'invoices.paid_amount',
            'invoices.balance_due_amount',
            'invoices.status',
            'invoices.issued_at',
            'invoices.cancelled_at',
            'invoices.created_at',
            'invoices.updated_at',
            (0, kysely_1.sql) `concat(residents.first_name, ' ', residents.last_name)`.as('residentName'),
            'residents.resident_code as residentCode',
        ])
            .groupBy([
            'invoices.id',
            'invoices.organization_id',
            'invoices.resident_id',
            'invoices.stay_id',
            'invoices.invoice_number',
            'invoices.billing_period_start',
            'invoices.billing_period_end',
            'invoices.due_date',
            'invoices.subtotal_amount',
            'invoices.discount_amount',
            'invoices.tax_amount',
            'invoices.total_amount',
            'invoices.paid_amount',
            'invoices.balance_due_amount',
            'invoices.status',
            'invoices.issued_at',
            'invoices.cancelled_at',
            'invoices.created_at',
            'invoices.updated_at',
            'residents.first_name',
            'residents.last_name',
            'residents.resident_code',
        ])
            .orderBy('invoices.created_at', 'desc')
            .offset((page - 1) * pageSize)
            .limit(pageSize)
            .execute();
        return { items: rows, total };
    }
    async findUnpaidInvoicesByStayForUpdate(organizationId, stayId, trx) {
        return await trx
            .selectFrom('invoices')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('status', 'in', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
            .where('balance_due_amount', '>', 0)
            .orderBy('due_date', 'asc')
            .forUpdate()
            .execute();
    }
    async updateInvoiceBalance(invoiceId, organizationId, allocAmount, trx) {
        const executor = this.getExecutor(trx);
        const inv = await this.findInvoiceById(invoiceId, organizationId, trx);
        if (!inv)
            throw new Error(`Invoice ${invoiceId} not found`);
        const newPaid = Number(inv.paid_amount) + allocAmount;
        const newBalance = Math.max(0, Number(inv.total_amount) - newPaid);
        const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
        return await executor
            .updateTable('invoices')
            .set({
            paid_amount: newPaid,
            balance_due_amount: newBalance,
            status: newStatus,
            updated_at: new Date(),
        })
            .where('id', '=', invoiceId)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async cancelInvoice(invoiceId, organizationId, trx) {
        return await this.getExecutor(trx)
            .updateTable('invoices')
            .set({
            status: 'CANCELLED',
            cancelled_at: new Date(),
            updated_at: new Date(),
        })
            .where('id', '=', invoiceId)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    // --- INVOICE ITEMS ---
    async createInvoiceItems(items, trx) {
        if (items.length === 0)
            return [];
        return await this.getExecutor(trx)
            .insertInto('invoice_items')
            .values(items.map((i) => ({
            organization_id: i.organization_id,
            invoice_id: i.invoice_id,
            charge_type: i.charge_type,
            description: i.description,
            unit_amount: i.unit_amount,
            quantity: i.quantity ?? 1.0,
            total_amount: i.total_amount,
        })))
            .returningAll()
            .execute();
    }
    async findInvoiceItemsByInvoiceId(invoiceId, organizationId, trx) {
        return await this.getExecutor(trx)
            .selectFrom('invoice_items')
            .selectAll()
            .where('invoice_id', '=', invoiceId)
            .where('organization_id', '=', organizationId)
            .execute();
    }
    // --- PAYMENTS ---
    async findByIdempotencyKey(organizationId, idempotencyKey, trx) {
        const row = await this.getExecutor(trx)
            .selectFrom('payments')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('idempotency_key', '=', idempotencyKey)
            .executeTakeFirst();
        return row || null;
    }
    async createPayment(data, trx) {
        return await this.getExecutor(trx)
            .insertInto('payments')
            .values({
            organization_id: data.organization_id,
            resident_id: data.resident_id,
            stay_id: data.stay_id,
            payment_number: data.payment_number,
            amount: data.amount,
            payment_method: data.payment_method,
            reference_number: data.reference_number || null,
            payment_date: data.payment_date,
            status: 'COMPLETED',
            idempotency_key: data.idempotency_key,
            received_by_user_id: data.received_by_user_id || null,
            notes: data.notes || null,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async findPaymentById(id, organizationId, trx) {
        const row = await this.getExecutor(trx)
            .selectFrom('payments')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findPaymentsByOrganization(organizationId, page = 1, pageSize = 20, trx) {
        const baseQuery = this.getExecutor(trx)
            .selectFrom('payments')
            .where('organization_id', '=', organizationId);
        const countRes = await baseQuery
            .select((0, kysely_1.sql) `count(*)::int`.as('count'))
            .executeTakeFirst();
        const total = countRes?.count || 0;
        const items = await baseQuery
            .selectAll()
            .orderBy('created_at', 'desc')
            .offset((page - 1) * pageSize)
            .limit(pageSize)
            .execute();
        return { items, total };
    }
    async findPaymentsByStay(organizationId, stayId, trx) {
        return await this.getExecutor(trx)
            .selectFrom('payments')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .orderBy('created_at', 'desc')
            .execute();
    }
    // --- ALLOCATIONS & RECEIPTS ---
    async createAllocation(data, trx) {
        return await this.getExecutor(trx)
            .insertInto('payment_allocations')
            .values({
            organization_id: data.organization_id,
            payment_id: data.payment_id,
            invoice_id: data.invoice_id,
            amount: data.amount,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async createReceipt(data, trx) {
        return await this.getExecutor(trx)
            .insertInto('receipts')
            .values({
            organization_id: data.organization_id,
            payment_id: data.payment_id,
            receipt_number: data.receipt_number,
            resident_id: data.resident_id,
            stay_id: data.stay_id,
            amount: data.amount,
            payment_method: data.payment_method,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async findReceiptByPaymentId(paymentId, organizationId, trx) {
        const row = await this.getExecutor(trx)
            .selectFrom('receipts')
            .selectAll()
            .where('payment_id', '=', paymentId)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findActiveInvoiceByStayAndPeriod(organizationId, stayId, billingPeriodStart, trx) {
        const row = await this.getExecutor(trx)
            .selectFrom('invoices')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('stay_id', '=', stayId)
            .where('billing_period_start', '=', billingPeriodStart)
            .where('status', '!=', 'CANCELLED')
            .executeTakeFirst();
        return row || null;
    }
    async findAllocationsByInvoiceId(organizationId, invoiceId, trx) {
        return await this.getExecutor(trx)
            .selectFrom('payment_allocations')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('invoice_id', '=', invoiceId)
            .execute();
    }
    async findInvoiceAllocationsWithPaymentAndReceipt(invoiceId, organizationId, trx) {
        return await this.getExecutor(trx)
            .selectFrom('payment_allocations')
            .innerJoin('payments', 'payments.id', 'payment_allocations.payment_id')
            .leftJoin('receipts', 'receipts.payment_id', 'payments.id')
            .select([
            'payments.id as paymentId',
            'payments.payment_number as paymentNumber',
            'payments.payment_date as paymentDate',
            'payments.amount as amount',
            'payment_allocations.amount as allocatedAmount',
            'payments.payment_method as paymentMethod',
            'payments.reference_number as referenceNumber',
            'receipts.receipt_number as receiptNumber',
        ])
            .where('payment_allocations.invoice_id', '=', invoiceId)
            .where('payment_allocations.organization_id', '=', organizationId)
            .orderBy('payments.payment_date', 'desc')
            .execute();
    }
    async getResidentLedger(organizationId, residentId, trx) {
        const executor = this.getExecutor(trx);
        const invoices = await executor
            .selectFrom('invoices')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('resident_id', '=', residentId)
            .where('status', '!=', 'CANCELLED')
            .orderBy('created_at', 'asc')
            .execute();
        const payments = await executor
            .selectFrom('payments')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('resident_id', '=', residentId)
            .where('status', '=', 'COMPLETED')
            .orderBy('created_at', 'asc')
            .execute();
        const invoiceItemsMap = new Map();
        for (const inv of invoices) {
            const items = await this.findInvoiceItemsByInvoiceId(inv.id, organizationId, trx);
            invoiceItemsMap.set(inv.id, items);
        }
        const paymentAllocMap = new Map();
        const paymentReceiptMap = new Map();
        for (const pay of payments) {
            const allocs = await executor
                .selectFrom('payment_allocations')
                .innerJoin('invoices', 'invoices.id', 'payment_allocations.invoice_id')
                .select([
                'payment_allocations.id',
                'payment_allocations.invoice_id as invoiceId',
                'invoices.invoice_number as invoiceNumber',
                'payment_allocations.amount',
                'payment_allocations.allocated_at as allocatedAt',
            ])
                .where('payment_allocations.payment_id', '=', pay.id)
                .where('payment_allocations.organization_id', '=', organizationId)
                .execute();
            paymentAllocMap.set(pay.id, allocs.map((a) => ({
                id: a.id,
                invoiceId: a.invoiceId,
                invoiceNumber: a.invoiceNumber,
                amount: Number(a.amount),
                allocatedAt: a.allocatedAt ? new Date(a.allocatedAt).toISOString() : '',
            })));
            const receipt = await this.findReceiptByPaymentId(pay.id, organizationId, trx);
            paymentReceiptMap.set(pay.id, receipt?.receipt_number || null);
        }
        const toPaise = (val) => Math.round(Number(val ?? 0) * 100);
        let totalInvoicedPaise = 0;
        let totalPaidPaise = 0;
        invoices.forEach((i) => (totalInvoicedPaise += toPaise(i.total_amount)));
        payments.forEach((p) => (totalPaidPaise += toPaise(p.amount)));
        const totalOutstandingPaise = Math.max(0, totalInvoicedPaise - totalPaidPaise);
        const rawEntries = [];
        invoices.forEach((inv) => {
            rawEntries.push({
                timestamp: new Date(inv.created_at || inv.issued_at).getTime(),
                entry: {
                    id: inv.id,
                    type: 'INVOICE',
                    date: inv.billing_period_start,
                    referenceNumber: inv.invoice_number,
                    description: `Monthly Invoice (${inv.billing_period_start} to ${inv.billing_period_end})`,
                    totalAmount: Number(inv.total_amount),
                    paidAmount: Number(inv.paid_amount),
                    balanceAmount: Number(inv.balance_due_amount),
                    status: inv.status,
                    items: (invoiceItemsMap.get(inv.id) || []).map((i) => ({
                        id: i.id,
                        organizationId: i.organization_id,
                        invoiceId: i.invoice_id,
                        chargeType: i.charge_type,
                        description: i.description,
                        unitAmount: Number(i.unit_amount),
                        quantity: Number(i.quantity),
                        totalAmount: Number(i.total_amount),
                    })),
                },
            });
        });
        payments.forEach((pay) => {
            rawEntries.push({
                timestamp: new Date(pay.created_at || pay.payment_date).getTime(),
                entry: {
                    id: pay.id,
                    type: 'PAYMENT',
                    date: pay.payment_date,
                    referenceNumber: pay.payment_number,
                    description: `Payment Collected (${pay.payment_method})${pay.reference_number ? ` - Ref: ${pay.reference_number}` : ''}`,
                    totalAmount: Number(pay.amount),
                    paidAmount: Number(pay.amount),
                    balanceAmount: 0,
                    status: pay.status,
                    allocations: paymentAllocMap.get(pay.id) || [],
                    receiptNumber: paymentReceiptMap.get(pay.id) || null,
                },
            });
        });
        rawEntries.sort((a, b) => a.timestamp - b.timestamp);
        return {
            residentId,
            stayId: invoices[0]?.stay_id || payments[0]?.stay_id || '',
            totalInvoiced: totalInvoicedPaise / 100,
            totalPaid: totalPaidPaise / 100,
            totalOutstanding: totalOutstandingPaise / 100,
            ledger: rawEntries.map((e) => e.entry),
        };
    }
    // --- METRICS ---
    async getFinancialOverviewMetrics(organizationId, trx) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const startMonthStr = startOfMonth.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        const invRes = await this.getExecutor(trx)
            .selectFrom('invoices')
            .select([
            (0, kysely_1.sql) `COALESCE(SUM(total_amount), 0)`.as('total_receivable'),
            (0, kysely_1.sql) `COALESCE(SUM(balance_due_amount), 0)`.as('total_outstanding'),
            (0, kysely_1.sql) `COALESCE(SUM(CASE WHEN status = 'OVERDUE' OR (status IN ('ISSUED', 'PARTIALLY_PAID') AND due_date < ${todayStr}) THEN balance_due_amount ELSE 0 END), 0)`.as('total_overdue'),
            (0, kysely_1.sql) `COALESCE(COUNT(CASE WHEN status = 'PAID' THEN 1 END), 0)::int`.as('paid_count'),
            (0, kysely_1.sql) `COALESCE(COUNT(CASE WHEN status = 'PARTIALLY_PAID' THEN 1 END), 0)::int`.as('partially_paid_count'),
            (0, kysely_1.sql) `COALESCE(COUNT(CASE WHEN status IN ('ISSUED', 'OVERDUE') THEN 1 END), 0)::int`.as('unpaid_count'),
        ])
            .where('organization_id', '=', organizationId)
            .where('status', '!=', 'CANCELLED')
            .executeTakeFirst();
        const payRes = await this.getExecutor(trx)
            .selectFrom('payments')
            .select((0, kysely_1.sql) `COALESCE(SUM(amount), 0)`.as('month_collected'))
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'COMPLETED')
            .where('payment_date', '>=', startMonthStr)
            .executeTakeFirst();
        const toPaise = (val) => Math.round(Number(val ?? 0) * 100);
        return {
            totalReceivable: toPaise(invRes?.total_receivable) / 100,
            collectedThisMonth: toPaise(payRes?.month_collected) / 100,
            totalOutstanding: toPaise(invRes?.total_outstanding) / 100,
            totalOverdue: toPaise(invRes?.total_overdue) / 100,
            paidInvoicesCount: Number(invRes?.paid_count ?? 0),
            partiallyPaidInvoicesCount: Number(invRes?.partially_paid_count ?? 0),
            unpaidInvoicesCount: Number(invRes?.unpaid_count ?? 0),
        };
    }
}
exports.KyselyBillingRepository = KyselyBillingRepository;
//# sourceMappingURL=billing.repository.js.map