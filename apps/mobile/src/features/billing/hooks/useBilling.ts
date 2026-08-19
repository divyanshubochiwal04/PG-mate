import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelInvoiceApi,
  generateInvoicesApi,
  getBillingConfigApi,
  getBillingOverviewApi,
  getInvoiceByIdApi,
  getInvoicesApi,
  getPaymentsApi,
  getReceiptApi,
  getResidentFinancialSummaryApi,
  getResidentLedgerApi,
  recordPaymentApi,
  updateBillingConfigApi,
} from '../api/billing.api';
import type {
  BillingInvoiceFilterDto,
  GenerateInvoicesDto,
  RecordPaymentDto,
  UpdateBillingConfigDto,
} from '@m-square/contracts';

export function useBillingConfig() {
  return useQuery({
    queryKey: ['billing', 'config'],
    queryFn: getBillingConfigApi,
  });
}

export function useUpdateBillingConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBillingConfigDto) => updateBillingConfigApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'config'] });
    },
  });
}

export function useBillingOverview() {
  return useQuery({
    queryKey: ['billing', 'overview'],
    queryFn: getBillingOverviewApi,
  });
}

export function useInvoices(query?: BillingInvoiceFilterDto) {
  return useQuery({
    queryKey: ['billing', 'invoices', query],
    queryFn: () => getInvoicesApi(query),
  });
}

export function useInvoiceDetails(id?: string) {
  return useQuery({
    queryKey: ['billing', 'invoice', id],
    queryFn: () => {
      if (!id) throw new Error('Invoice ID required');
      return getInvoiceByIdApi(id);
    },
    enabled: Boolean(id && id !== 'index' && id !== 'undefined'),
  });
}

export function useGenerateInvoices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input?: GenerateInvoicesDto) => generateInvoicesApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelInvoiceApi(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'invoice', id] });
    },
  });
}

export function useResidentFinancialSummary(residentId?: string) {
  return useQuery({
    queryKey: ['billing', 'resident-summary', residentId],
    queryFn: () => {
      if (!residentId) throw new Error('Resident ID required');
      return getResidentFinancialSummaryApi(residentId);
    },
    enabled: !!residentId,
  });
}

export function useResidentLedger(residentId?: string) {
  return useQuery({
    queryKey: ['billing', 'resident-ledger', residentId],
    queryFn: () => {
      if (!residentId) throw new Error('Resident ID required');
      return getResidentLedgerApi(residentId);
    },
    enabled: !!residentId,
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ['payments', 'list'],
    queryFn: getPaymentsApi,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentDto) => recordPaymentApi(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] });
      if (variables.invoiceId) {
        queryClient.invalidateQueries({ queryKey: ['billing', 'invoice', variables.invoiceId] });
      }
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['resident', variables.residentId] });
      queryClient.invalidateQueries({ queryKey: ['resident-billing', variables.residentId] });
      queryClient.invalidateQueries({
        queryKey: ['billing', 'resident-summary', variables.residentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['billing', 'resident-ledger', variables.residentId],
      });
    },
  });
}

export function useReceipt(paymentId?: string) {
  return useQuery({
    queryKey: ['payments', 'receipt', paymentId],
    queryFn: () => {
      if (!paymentId) throw new Error('Payment ID required');
      return getReceiptApi(paymentId);
    },
    enabled: !!paymentId,
  });
}
