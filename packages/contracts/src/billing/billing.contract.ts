export type InvoiceStatusDto =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type InvoiceChargeTypeDto =
  | 'BASE_RENT'
  | 'FACILITY'
  | 'MESS'
  | 'ADDITIONAL_CHARGE'
  | 'LATE_FEE'
  | 'DISCOUNT'
  | 'ADJUSTMENT';

export type PaymentMethodDto = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';

export type PaymentStatusDto = 'COMPLETED' | 'REVERSED';

export interface BillingConfigDto {
  id: string;
  organizationId: string;
  gracePeriodDays: number;
  lateFeePerDay: number;
  defaultBillingCycle: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBillingConfigDto {
  gracePeriodDays?: number;
  lateFeePerDay?: number;
  defaultBillingCycle?: string;
}

export interface InvoiceItemDto {
  id?: string;
  organizationId?: string;
  invoiceId?: string;
  chargeType: InvoiceChargeTypeDto;
  description: string;
  unitAmount: number;
  quantity: number;
  totalAmount: number;
}

export interface InvoicePaymentHistoryDto {
  paymentId: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  allocatedAmount: number;
  paymentMethod: PaymentMethodDto;
  referenceNumber?: string | null;
  receiptNumber?: string | null;
}

export interface InvoiceDto {
  id: string;
  organizationId: string;
  residentId: string;
  stayId: string;
  invoiceNumber: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDueAmount: number;
  status: InvoiceStatusDto;
  issuedAt: string;
  cancelledAt?: string | null;
  items?: InvoiceItemDto[];
  payments?: InvoicePaymentHistoryDto[];
  residentName?: string;
  residentCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateInvoicesDto {
  billingPeriod?: string; // Format: YYYY-MM
  propertyId?: string;
  buildingId?: string;
  residentId?: string;
  stayId?: string;
}

export interface PaymentDto {
  id: string;
  organizationId: string;
  residentId: string;
  stayId: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: PaymentMethodDto;
  referenceNumber?: string | null;
  paymentDate: string;
  status: PaymentStatusDto;
  idempotencyKey: string;
  receivedByUserId?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface RecordPaymentDto {
  residentId: string;
  stayId?: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: PaymentMethodDto;
  referenceNumber?: string;
  paymentDate?: string;
  idempotencyKey: string;
  notes?: string;
}

export interface ReceiptDto {
  id: string;
  organizationId: string;
  paymentId: string;
  receiptNumber: string;
  residentId: string;
  stayId: string;
  amount: number;
  paymentMethod: PaymentMethodDto;
  generatedAt: string;
}

export interface BillingOverviewMetricsDto {
  totalReceivable: number;
  collectedThisMonth: number;
  totalOutstanding: number;
  totalOverdue: number;
  paidInvoicesCount: number;
  partiallyPaidInvoicesCount: number;
  unpaidInvoicesCount: number;
}

export interface ResidentFinancialSummaryDto {
  residentId: string;
  stayId: string;
  baseRent: number;
  messCharge: number;
  facilitiesCharge: number;
  extraCharges: number;
  totalMonthlyBilling: number;
  totalPaid: number;
  netDue: number;
  securityDepositAmount: number;
  securityDepositStatus: string;
}

export interface BillingInvoiceFilterDto {
  search?: string;
  propertyId?: string;
  buildingId?: string;
  billingPeriod?: string;
  status?: InvoiceStatusDto;
  residentId?: string;
  stayId?: string;
  page?: number;
  pageSize?: number;
}

export interface ResidentBillingLedgerItemDto {
  id: string;
  type: 'INVOICE' | 'PAYMENT';
  date: string;
  referenceNumber: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  items?: InvoiceItemDto[];
  allocations?: {
    id: string;
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    allocatedAt: string;
  }[];
  receiptNumber?: string | null;
}

export interface ResidentBillingLedgerDto {
  residentId: string;
  stayId: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  ledger: ResidentBillingLedgerItemDto[];
}
