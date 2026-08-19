import type { ColumnType, Generated, Selectable } from 'kysely';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type InvoiceChargeType = 'BASE_RENT' | 'FACILITY' | 'MESS' | 'ADDITIONAL_CHARGE' | 'LATE_FEE' | 'DISCOUNT' | 'ADJUSTMENT';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';
export type PaymentStatus = 'COMPLETED' | 'REVERSED';
export interface BillingConfigurationsTable {
    id: Generated<string>;
    organization_id: string;
    grace_period_days: number;
    late_fee_per_day: ColumnType<number, number | string, number | string>;
    default_billing_cycle: string;
    created_at: ColumnType<Date, string | Date | undefined, never>;
    updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}
export interface InvoicesTable {
    id: Generated<string>;
    organization_id: string;
    resident_id: string;
    stay_id: string;
    invoice_number: string;
    billing_period_start: string;
    billing_period_end: string;
    due_date: string;
    subtotal_amount: ColumnType<number, number | string, number | string>;
    discount_amount: ColumnType<number, number | string, number | string>;
    tax_amount: ColumnType<number, number | string, number | string>;
    total_amount: ColumnType<number, number | string, number | string>;
    paid_amount: ColumnType<number, number | string, number | string>;
    balance_due_amount: ColumnType<number, number | string, number | string>;
    status: InvoiceStatus;
    issued_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
    cancelled_at: ColumnType<Date | null, string | Date | null | undefined, string | Date | null | undefined>;
    created_at: ColumnType<Date, string | Date | undefined, never>;
    updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}
export interface InvoiceItemsTable {
    id: Generated<string>;
    organization_id: string;
    invoice_id: string;
    charge_type: InvoiceChargeType;
    description: string;
    unit_amount: ColumnType<number, number | string, number | string>;
    quantity: ColumnType<number, number | string, number | string>;
    total_amount: ColumnType<number, number | string, number | string>;
}
export interface PaymentsTable {
    id: Generated<string>;
    organization_id: string;
    resident_id: string;
    stay_id: string;
    payment_number: string;
    amount: ColumnType<number, number | string, number | string>;
    payment_method: PaymentMethod;
    reference_number: string | null;
    payment_date: string;
    status: PaymentStatus;
    idempotency_key: string;
    received_by_user_id: string | null;
    notes: string | null;
    created_at: ColumnType<Date, string | Date | undefined, never>;
}
export interface PaymentAllocationsTable {
    id: Generated<string>;
    organization_id: string;
    payment_id: string;
    invoice_id: string;
    amount: ColumnType<number, number | string, number | string>;
    allocated_at: ColumnType<Date, string | Date | undefined, never>;
}
export interface ReceiptsTable {
    id: Generated<string>;
    organization_id: string;
    payment_id: string;
    receipt_number: string;
    resident_id: string;
    stay_id: string;
    amount: ColumnType<number, number | string, number | string>;
    payment_method: PaymentMethod;
    generated_at: ColumnType<Date, string | Date | undefined, never>;
}
export type BillingConfigurationRow = Selectable<BillingConfigurationsTable>;
export type InvoiceRow = Selectable<InvoicesTable>;
export type InvoiceItemRow = Selectable<InvoiceItemsTable>;
export type PaymentRow = Selectable<PaymentsTable>;
export type PaymentAllocationRow = Selectable<PaymentAllocationsTable>;
export type ReceiptRow = Selectable<ReceiptsTable>;
//# sourceMappingURL=billing.schema.d.ts.map