import { apiClient } from '../../../api/client';
import type {
  BillingConfigDto,
  BillingInvoiceFilterDto,
  BillingOverviewMetricsDto,
  GenerateInvoicesDto,
  InvoiceDto,
  PaymentDto,
  ReceiptDto,
  RecordPaymentDto,
  ResidentBillingLedgerDto,
  ResidentFinancialSummaryDto,
  UpdateBillingConfigDto,
} from '@m-square/contracts';

export async function getBillingConfigApi(): Promise<BillingConfigDto> {
  const res = await apiClient.get<{ data: BillingConfigDto }>('/billing/config');
  return res.data.data;
}

export async function updateBillingConfigApi(
  input: UpdateBillingConfigDto
): Promise<BillingConfigDto> {
  const res = await apiClient.put<{ data: BillingConfigDto }>('/billing/config', input);
  return res.data.data;
}

export async function getBillingOverviewApi(): Promise<BillingOverviewMetricsDto> {
  const res = await apiClient.get<{ data: BillingOverviewMetricsDto }>('/billing/overview');
  return res.data.data;
}

export async function getInvoicesApi(
  query?: BillingInvoiceFilterDto
): Promise<{ items: InvoiceDto[]; total: number }> {
  const res = await apiClient.get<{ data: { items: InvoiceDto[]; total: number } }>(
    '/billing/invoices',
    { params: query }
  );
  return res.data.data;
}

export async function generateInvoicesApi(input?: GenerateInvoicesDto): Promise<InvoiceDto[]> {
  const res = await apiClient.post<{ data: InvoiceDto[] }>('/billing/invoices/generate', input);
  return res.data.data;
}

export async function getInvoiceByIdApi(id: string): Promise<InvoiceDto> {
  const res = await apiClient.get<{ data: InvoiceDto }>(`/billing/invoices/${id}`);
  return res.data.data;
}

export async function cancelInvoiceApi(id: string): Promise<InvoiceDto> {
  const res = await apiClient.post<{ data: InvoiceDto }>(`/billing/invoices/${id}/cancel`);
  return res.data.data;
}

export async function getResidentFinancialSummaryApi(
  residentId: string
): Promise<ResidentFinancialSummaryDto> {
  const res = await apiClient.get<{ data: ResidentFinancialSummaryDto }>(
    `/billing/residents/${residentId}/summary`
  );
  return res.data.data;
}

export async function getResidentLedgerApi(
  residentId: string
): Promise<ResidentBillingLedgerDto> {
  const res = await apiClient.get<{ data: ResidentBillingLedgerDto }>(
    `/billing/residents/${residentId}/ledger`
  );
  return res.data.data;
}

export async function getPaymentsApi(): Promise<PaymentDto[]> {
  const res = await apiClient.get<{ data: { items: PaymentDto[]; total: number } }>('/payments');
  return res.data.data.items;
}

export async function recordPaymentApi(input: RecordPaymentDto): Promise<PaymentDto> {
  const res = await apiClient.post<{ data: PaymentDto }>('/payments', input);
  return res.data.data;
}

export async function getReceiptApi(paymentId: string): Promise<ReceiptDto> {
  const res = await apiClient.get<{ data: ReceiptDto }>(`/payments/${paymentId}/receipt`);
  return res.data.data;
}
