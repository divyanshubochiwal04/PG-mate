import { type Kysely, type Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type { BillingConfigurationRow, InvoiceItemRow, InvoiceRow, InvoiceStatus, PaymentAllocationRow, PaymentMethod, PaymentRow, ReceiptRow } from '../schema/billing.schema';
export declare class KyselyBillingRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getExecutor;
    getConfig(organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<BillingConfigurationRow | null>;
    upsertConfig(organizationId: string, data: {
        gracePeriodDays?: number;
        lateFeePerDay?: number;
        defaultBillingCycle?: string;
    }, trx?: Transaction<DatabaseSchema>): Promise<BillingConfigurationRow>;
    createInvoice(data: {
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
    }, trx?: Transaction<DatabaseSchema>): Promise<InvoiceRow>;
    findInvoiceById(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<(InvoiceRow & {
        residentName?: string;
        residentCode?: string;
    }) | null>;
    findInvoicesByOrganization(organizationId: string, options?: {
        search?: string;
        propertyId?: string;
        buildingId?: string;
        billingPeriod?: string;
        status?: InvoiceStatus;
        residentId?: string;
        stayId?: string;
        page?: number;
        pageSize?: number;
    }, trx?: Transaction<DatabaseSchema>): Promise<{
        items: (InvoiceRow & {
            residentName?: string;
            residentCode?: string;
        })[];
        total: number;
    }>;
    findUnpaidInvoicesByStayForUpdate(organizationId: string, stayId: string, trx: Transaction<DatabaseSchema>): Promise<InvoiceRow[]>;
    updateInvoiceBalance(invoiceId: string, organizationId: string, allocAmount: number, trx?: Transaction<DatabaseSchema>): Promise<InvoiceRow>;
    cancelInvoice(invoiceId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<InvoiceRow>;
    createInvoiceItems(items: {
        organization_id: string;
        invoice_id: string;
        charge_type: 'BASE_RENT' | 'FACILITY' | 'MESS' | 'ADDITIONAL_CHARGE' | 'LATE_FEE' | 'DISCOUNT' | 'ADJUSTMENT';
        description: string;
        unit_amount: number;
        quantity?: number;
        total_amount: number;
    }[], trx?: Transaction<DatabaseSchema>): Promise<InvoiceItemRow[]>;
    findInvoiceItemsByInvoiceId(invoiceId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<InvoiceItemRow[]>;
    findByIdempotencyKey(organizationId: string, idempotencyKey: string, trx?: Transaction<DatabaseSchema>): Promise<PaymentRow | null>;
    createPayment(data: {
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
    }, trx?: Transaction<DatabaseSchema>): Promise<PaymentRow>;
    findPaymentById(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<PaymentRow | null>;
    findPaymentsByOrganization(organizationId: string, page?: number, pageSize?: number, trx?: Transaction<DatabaseSchema>): Promise<{
        items: PaymentRow[];
        total: number;
    }>;
    findPaymentsByStay(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<PaymentRow[]>;
    createAllocation(data: {
        organization_id: string;
        payment_id: string;
        invoice_id: string;
        amount: number;
    }, trx?: Transaction<DatabaseSchema>): Promise<PaymentAllocationRow>;
    createReceipt(data: {
        organization_id: string;
        payment_id: string;
        receipt_number: string;
        resident_id: string;
        stay_id: string;
        amount: number;
        payment_method: PaymentMethod;
    }, trx?: Transaction<DatabaseSchema>): Promise<ReceiptRow>;
    findReceiptByPaymentId(paymentId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<ReceiptRow | null>;
    findActiveInvoiceByStayAndPeriod(organizationId: string, stayId: string, billingPeriodStart: string, trx?: Transaction<DatabaseSchema>): Promise<InvoiceRow | null>;
    findAllocationsByInvoiceId(organizationId: string, invoiceId: string, trx?: Transaction<DatabaseSchema>): Promise<PaymentAllocationRow[]>;
    findInvoiceAllocationsWithPaymentAndReceipt(invoiceId: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<{
        paymentId: string;
        paymentNumber: string;
        paymentDate: string;
        amount: number;
        allocatedAmount: number;
        paymentMethod: PaymentMethod;
        referenceNumber: string | null;
        receiptNumber: string | null;
    }[]>;
    getResidentLedger(organizationId: string, residentId: string, trx?: Transaction<DatabaseSchema>): Promise<{
        residentId: string;
        stayId: string;
        totalInvoiced: number;
        totalPaid: number;
        totalOutstanding: number;
        ledger: any[];
    }>;
    getFinancialOverviewMetrics(organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<{
        totalReceivable: number;
        collectedThisMonth: number;
        totalOutstanding: number;
        totalOverdue: number;
        paidInvoicesCount: number;
        partiallyPaidInvoicesCount: number;
        unpaidInvoicesCount: number;
    }>;
}
//# sourceMappingURL=billing.repository.d.ts.map