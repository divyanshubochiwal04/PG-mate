import { type Kysely, sql, type Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type {
  BillingConfigurationRow,
  InvoiceItemRow,
  InvoiceRow,
  InvoiceStatus,
  PaymentAllocationRow,
  PaymentMethod,
  PaymentRow,
  ReceiptRow,
} from '../schema/billing.schema';

export class KyselyBillingRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private getExecutor(trx?: Transaction<DatabaseSchema>) {
    return trx && typeof (trx as unknown as Record<string, unknown>).selectFrom === 'function'
      ? trx
      : this.db;
  }

  // --- CONFIG ---
  public async getConfig(
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<BillingConfigurationRow | null> {
    const executor = this.getExecutor(trx);
    if (!executor || typeof (executor as unknown as Record<string, unknown>).selectFrom !== 'function') {
      return null;
    }
    const row = await executor
      .selectFrom('billing_configurations')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async upsertConfig(
    organizationId: string,
    data: { gracePeriodDays?: number; lateFeePerDay?: number; defaultBillingCycle?: string },
    trx?: Transaction<DatabaseSchema>
  ): Promise<BillingConfigurationRow> {
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
  public async createInvoice(
    data: {
      organization_id: string;
      resident_id: string;
      stay_id: string;
      invoice_number: string;
      billing_period_start: string;
      billing_period_end: string;
      due_date: string;
      subtotal_amount: number;
      discount_amount?: number;
      tax_amount?: number;
      total_amount: number;
      paid_amount?: number;
      balance_due_amount: number;
      status?: InvoiceStatus;
    },
    trx?: Transaction<DatabaseSchema>
  ): Promise<InvoiceRow> {
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

  public async findInvoiceById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<(InvoiceRow & { residentName?: string; residentCode?: string }) | null> {
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
        sql<string>`concat(residents.first_name, ' ', residents.last_name)`.as('residentName'),
        'residents.resident_code as residentCode',
      ])
      .where('invoices.id', '=', id)
      .where('invoices.organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async findInvoicesByOrganization(
    organizationId: string,
    options?: {
      search?: string;
      propertyId?: string;
      buildingId?: string;
      billingPeriod?: string;
      status?: InvoiceStatus;
      residentId?: string;
      stayId?: string;
      page?: number;
      pageSize?: number;
    },
    trx?: Transaction<DatabaseSchema>
  ): Promise<{
    items: (InvoiceRow & { residentName?: string; residentCode?: string })[];
    total: number;
  }> {
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
      baseQuery = baseQuery.where(
        sql<boolean>`TO_CHAR(invoices.billing_period_start, 'YYYY-MM') = ${options.billingPeriod}`
      );
    }
    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('invoices.invoice_number', 'ilike', searchTerm),
          eb('residents.first_name', 'ilike', searchTerm),
          eb('residents.last_name', 'ilike', searchTerm),
          eb('residents.resident_code', 'ilike', searchTerm),
          eb('residents.phone', 'ilike', searchTerm),
        ])
      );
    }

    if (options?.propertyId || options?.buildingId) {
      baseQuery = (baseQuery as any)
        .innerJoin('bed_allocations', 'bed_allocations.stay_id', 'invoices.stay_id')
        .innerJoin('beds', 'beds.id', 'bed_allocations.bed_id')
        .innerJoin('rooms', 'rooms.id', 'beds.room_id')
        .innerJoin('floors', 'floors.id', 'rooms.floor_id')
        .innerJoin('buildings', 'buildings.id', 'floors.building_id');

      if (options.buildingId) {
        baseQuery = (baseQuery as any).where('buildings.id', '=', options.buildingId);
      }
      if (options.propertyId) {
        baseQuery = (baseQuery as any).where('buildings.property_id', '=', options.propertyId);
      }
    }

    const countRes = await baseQuery
      .select(sql<number>`count(distinct invoices.id)::int`.as('count'))
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
        sql<string>`concat(residents.first_name, ' ', residents.last_name)`.as('residentName'),
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

  public async findUnpaidInvoicesByStayForUpdate(
    organizationId: string,
    stayId: string,
    trx: Transaction<DatabaseSchema>
  ): Promise<InvoiceRow[]> {
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

  public async updateInvoiceBalance(
    invoiceId: string,
    organizationId: string,
    allocAmount: number,
    trx?: Transaction<DatabaseSchema>
  ): Promise<InvoiceRow> {
    const executor = this.getExecutor(trx);
    const inv = await this.findInvoiceById(invoiceId, organizationId, trx);
    if (!inv) throw new Error(`Invoice ${invoiceId} not found`);

    const newPaid = Number(inv.paid_amount) + allocAmount;
    const newBalance = Math.max(0, Number(inv.total_amount) - newPaid);
    const newStatus: InvoiceStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

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

  public async cancelInvoice(
    invoiceId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<InvoiceRow> {
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
  public async createInvoiceItems(
    items: {
      organization_id: string;
      invoice_id: string;
      charge_type:
        | 'BASE_RENT'
        | 'FACILITY'
        | 'MESS'
        | 'ADDITIONAL_CHARGE'
        | 'LATE_FEE'
        | 'DISCOUNT'
        | 'ADJUSTMENT';
      description: string;
      unit_amount: number;
      quantity?: number;
      total_amount: number;
    }[],
    trx?: Transaction<DatabaseSchema>
  ): Promise<InvoiceItemRow[]> {
    if (items.length === 0) return [];
    return await this.getExecutor(trx)
      .insertInto('invoice_items')
      .values(
        items.map((i) => ({
          organization_id: i.organization_id,
          invoice_id: i.invoice_id,
          charge_type: i.charge_type,
          description: i.description,
          unit_amount: i.unit_amount,
          quantity: i.quantity ?? 1.0,
          total_amount: i.total_amount,
        }))
      )
      .returningAll()
      .execute();
  }

  public async findInvoiceItemsByInvoiceId(
    invoiceId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<InvoiceItemRow[]> {
    return await this.getExecutor(trx)
      .selectFrom('invoice_items')
      .selectAll()
      .where('invoice_id', '=', invoiceId)
      .where('organization_id', '=', organizationId)
      .execute();
  }

  // --- PAYMENTS ---
  public async findByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<PaymentRow | null> {
    const row = await this.getExecutor(trx)
      .selectFrom('payments')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('idempotency_key', '=', idempotencyKey)
      .executeTakeFirst();
    return row || null;
  }

  public async createPayment(
    data: {
      organization_id: string;
      resident_id: string;
      stay_id: string;
      payment_number: string;
      amount: number;
      payment_method: PaymentMethod;
      reference_number?: string | null;
      payment_date: string;
      idempotency_key: string;
      received_by_user_id?: string | null;
      notes?: string | null;
    },
    trx?: Transaction<DatabaseSchema>
  ): Promise<PaymentRow> {
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

  public async findPaymentById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<PaymentRow | null> {
    const row = await this.getExecutor(trx)
      .selectFrom('payments')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async findPaymentsByOrganization(
    organizationId: string,
    page = 1,
    pageSize = 20,
    trx?: Transaction<DatabaseSchema>
  ): Promise<{ items: PaymentRow[]; total: number }> {
    const baseQuery = this.getExecutor(trx)
      .selectFrom('payments')
      .where('organization_id', '=', organizationId);
    const countRes = await baseQuery
      .select(sql<number>`count(*)::int`.as('count'))
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

  public async findPaymentsByStay(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<PaymentRow[]> {
    return await this.getExecutor(trx)
      .selectFrom('payments')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('stay_id', '=', stayId)
      .orderBy('created_at', 'desc')
      .execute();
  }

  // --- ALLOCATIONS & RECEIPTS ---
  public async createAllocation(
    data: { organization_id: string; payment_id: string; invoice_id: string; amount: number },
    trx?: Transaction<DatabaseSchema>
  ): Promise<PaymentAllocationRow> {
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

  public async createReceipt(
    data: {
      organization_id: string;
      payment_id: string;
      receipt_number: string;
      resident_id: string;
      stay_id: string;
      amount: number;
      payment_method: PaymentMethod;
    },
    trx?: Transaction<DatabaseSchema>
  ): Promise<ReceiptRow> {
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

  public async findReceiptByPaymentId(
    paymentId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ReceiptRow | null> {
    const row = await this.getExecutor(trx)
      .selectFrom('receipts')
      .selectAll()
      .where('payment_id', '=', paymentId)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async findActiveInvoiceByStayAndPeriod(
    organizationId: string,
    stayId: string,
    billingPeriodStart: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<InvoiceRow | null> {
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

  public async findAllocationsByInvoiceId(
    organizationId: string,
    invoiceId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<PaymentAllocationRow[]> {
    return await this.getExecutor(trx)
      .selectFrom('payment_allocations')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('invoice_id', '=', invoiceId)
      .execute();
  }

  public async findInvoiceAllocationsWithPaymentAndReceipt(
    invoiceId: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ) {
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

  public async getResidentLedger(
    organizationId: string,
    residentId: string,
    trx?: Transaction<DatabaseSchema>
  ) {
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

    const invoiceItemsMap = new Map<string, InvoiceItemRow[]>();
    for (const inv of invoices) {
      const items = await this.findInvoiceItemsByInvoiceId(inv.id, organizationId, trx);
      invoiceItemsMap.set(inv.id, items);
    }

    const paymentAllocMap = new Map<
      string,
      {
        id: string;
        invoiceId: string;
        invoiceNumber: string;
        amount: number;
        allocatedAt: string;
      }[]
    >();
    const paymentReceiptMap = new Map<string, string | null>();

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

      paymentAllocMap.set(
        pay.id,
        allocs.map((a) => ({
          id: a.id,
          invoiceId: a.invoiceId,
          invoiceNumber: a.invoiceNumber,
          amount: Number(a.amount),
          allocatedAt: a.allocatedAt ? new Date(a.allocatedAt).toISOString() : '',
        }))
      );

      const receipt = await this.findReceiptByPaymentId(pay.id, organizationId, trx);
      paymentReceiptMap.set(pay.id, receipt?.receipt_number || null);
    }

    const toPaise = (val: number | string | null | undefined) => Math.round(Number(val ?? 0) * 100);

    let totalInvoicedPaise = 0;
    let totalPaidPaise = 0;

    invoices.forEach((i) => (totalInvoicedPaise += toPaise(i.total_amount)));
    payments.forEach((p) => (totalPaidPaise += toPaise(p.amount)));

    const totalOutstandingPaise = Math.max(0, totalInvoicedPaise - totalPaidPaise);

    const rawEntries: {
      timestamp: number;
      entry: any;
    }[] = [];

    invoices.forEach((inv) => {
      rawEntries.push({
        timestamp: new Date(inv.created_at || inv.issued_at).getTime(),
        entry: {
          id: inv.id,
          type: 'INVOICE' as const,
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
          type: 'PAYMENT' as const,
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
  public async getFinancialOverviewMetrics(
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<{
    totalReceivable: number;
    collectedThisMonth: number;
    totalOutstanding: number;
    totalOverdue: number;
    paidInvoicesCount: number;
    partiallyPaidInvoicesCount: number;
    unpaidInvoicesCount: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startMonthStr = startOfMonth.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const invRes = await this.getExecutor(trx)
      .selectFrom('invoices')
      .select([
        sql<string | number>`COALESCE(SUM(total_amount), 0)`.as('total_receivable'),
        sql<string | number>`COALESCE(SUM(balance_due_amount), 0)`.as('total_outstanding'),
        sql<string | number>`COALESCE(SUM(CASE WHEN status = 'OVERDUE' OR (status IN ('ISSUED', 'PARTIALLY_PAID') AND due_date < ${todayStr}) THEN balance_due_amount ELSE 0 END), 0)`.as('total_overdue'),
        sql<number>`COALESCE(COUNT(CASE WHEN status = 'PAID' THEN 1 END), 0)::int`.as('paid_count'),
        sql<number>`COALESCE(COUNT(CASE WHEN status = 'PARTIALLY_PAID' THEN 1 END), 0)::int`.as(
          'partially_paid_count'
        ),
        sql<number>`COALESCE(COUNT(CASE WHEN status IN ('ISSUED', 'OVERDUE') THEN 1 END), 0)::int`.as(
          'unpaid_count'
        ),
      ])
      .where('organization_id', '=', organizationId)
      .where('status', '!=', 'CANCELLED')
      .executeTakeFirst();

    const payRes = await this.getExecutor(trx)
      .selectFrom('payments')
      .select(sql<string | number>`COALESCE(SUM(amount), 0)`.as('month_collected'))
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'COMPLETED')
      .where('payment_date', '>=', startMonthStr)
      .executeTakeFirst();

    const toPaise = (val: string | number | null | undefined) => Math.round(Number(val ?? 0) * 100);

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
