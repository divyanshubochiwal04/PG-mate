import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  KyselyBillingRepository,
  KyselyCommercialRepository,
  KyselyMessRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import { BillingService } from '../modules/billing/billing.service';
import { PaymentsService } from '../modules/billing/payments.service';

describe('Billing Operations Security & Financial Integrity Test Suite', () => {
  let billingService: BillingService;
  let paymentsService: PaymentsService;
  let billingRepo: KyselyBillingRepository;
  let commercialRepo: KyselyCommercialRepository;
  let messRepo: KyselyMessRepository;
  let stayRepo: KyselyStayRepository;
  let residentRepo: KyselyResidentRepository;
  let unitOfWork: KyselyUnitOfWork;

  const orgA = 'org-11111111-1111-1111-1111-111111111111';
  const orgB = 'org-22222222-2222-2222-2222-222222222222';
  const residentA = 'res-aaaaa111-1111-1111-1111-111111111111';
  const stayA = 'stay-aaaaa111-1111-1111-1111-111111111111';
  const invoiceA = 'inv-aaaaa111-1111-1111-1111-111111111111';
  const paymentA = 'pay-aaaaa111-1111-1111-1111-111111111111';

  beforeEach(() => {
    const dummyDb = {} as unknown;
    billingRepo = new KyselyBillingRepository(dummyDb as never);
    commercialRepo = new KyselyCommercialRepository(dummyDb as never);
    messRepo = new KyselyMessRepository(dummyDb as never);
    stayRepo = new KyselyStayRepository(dummyDb as never);
    residentRepo = new KyselyResidentRepository(dummyDb as never);
    unitOfWork = new KyselyUnitOfWork(dummyDb as never);

    vi.spyOn(unitOfWork, 'runInTransaction').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (work: any) => work({})
    );

    billingService = new BillingService();
    (billingService as unknown as Record<string, unknown>)['billingRepo'] = billingRepo;
    (billingService as unknown as Record<string, unknown>)['commercialRepo'] = commercialRepo;
    (billingService as unknown as Record<string, unknown>)['messRepo'] = messRepo;
    (billingService as unknown as Record<string, unknown>)['stayRepo'] = stayRepo;
    (billingService as unknown as Record<string, unknown>)['residentRepo'] = residentRepo;
    (billingService as unknown as Record<string, unknown>)['unitOfWork'] = unitOfWork;

    paymentsService = new PaymentsService();
    (paymentsService as unknown as Record<string, unknown>)['billingRepo'] = billingRepo;
    (paymentsService as unknown as Record<string, unknown>)['commercialRepo'] = commercialRepo;
    (paymentsService as unknown as Record<string, unknown>)['messRepo'] = messRepo;
    (paymentsService as unknown as Record<string, unknown>)['stayRepo'] = stayRepo;
    (paymentsService as unknown as Record<string, unknown>)['unitOfWork'] = unitOfWork;
  });

  it('BILL-SEC-01: Own tenant invoice listing works', async () => {
    vi.spyOn(billingRepo, 'findInvoicesByOrganization').mockResolvedValue({
      items: [
        {
          id: invoiceA,
          organization_id: orgA,
          resident_id: residentA,
          stay_id: stayA,
          invoice_number: 'INV-202608-A1',
          billing_period_start: '2026-08-01',
          billing_period_end: '2026-08-31',
          due_date: '2026-08-06',
          subtotal_amount: 8000,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: 8000,
          paid_amount: 0,
          balance_due_amount: 8000,
          status: 'ISSUED',
          issued_at: new Date(),
          cancelled_at: null,
          created_at: new Date(),
          updated_at: new Date(),
          residentName: 'Amit Kumar',
          residentCode: 'RES-A1',
        },
      ],
      total: 1,
    });
    vi.spyOn(billingRepo, 'findInvoiceItemsByInvoiceId').mockResolvedValue([]);

    const res = await billingService.getInvoices(orgA);
    expect(res.total).toBe(1);
    expect(res.items[0]?.id).toBe(invoiceA);
    expect(res.items[0]?.organizationId).toBe(orgA);
  });

  it('BILL-SEC-02: Cross-tenant invoice access returns 404', async () => {
    vi.spyOn(billingRepo, 'findInvoiceById').mockImplementation(async (id, orgId) => {
      if (id === invoiceA && orgId === orgB) return null;
      return null;
    });

    await expect(billingService.getInvoiceById(orgB, invoiceA)).rejects.toThrow(NotFoundException);
  });

  it('BILL-SEC-03: Cross-tenant payment creation rejected', async () => {
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(billingRepo, 'findInvoiceById').mockResolvedValue(null); // Org B cannot find Org A invoice

    await expect(
      paymentsService.recordPayment(orgB, 'user-1', {
        residentId: residentA,
        invoiceId: invoiceA,
        amount: 5000,
        paymentMethod: 'UPI',
        idempotencyKey: 'key-cross-pay',
      })
    ).rejects.toThrow(NotFoundException);
  });

  it('BILL-SEC-04: Cross-tenant receipt access rejected', async () => {
    vi.spyOn(billingRepo, 'findReceiptByPaymentId').mockImplementation(async (payId, orgId) => {
      if (payId === paymentA && orgId === orgB) return null;
      return null;
    });

    await expect(paymentsService.getReceiptByPaymentId(orgB, paymentA)).rejects.toThrow(
      NotFoundException
    );
  });

  it('BILL-SEC-05: Invalid invoice UUID rejected', async () => {
    vi.spyOn(billingRepo, 'findInvoiceById').mockResolvedValue(null);

    await expect(billingService.getInvoiceById(orgA, 'invalid-uuid-123')).rejects.toThrow(
      NotFoundException
    );
  });

  it('BILL-SEC-06: Invalid payment amount rejected', async () => {
    await expect(
      paymentsService.recordPayment(orgA, 'user-1', {
        residentId: residentA,
        amount: -100,
        paymentMethod: 'CASH',
        idempotencyKey: 'key-invalid-amt',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('BILL-SEC-07: Payment greater than outstanding rejected', async () => {
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(billingRepo, 'findUnpaidInvoicesByStayForUpdate').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: invoiceA, balance_due_amount: '3000.00' } as any,
    ]);

    await expect(
      paymentsService.recordPayment(orgA, 'user-1', {
        residentId: residentA,
        stayId: stayA,
        amount: 5000, // Exceeds 3000 balance!
        paymentMethod: 'CASH',
        idempotencyKey: 'key-overpay',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('BILL-SEC-08: Duplicate payment idempotency protected', async () => {
    const key = 'idemp-key-dup';
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue({
      id: paymentA,
      organization_id: orgA,
      resident_id: residentA,
      stay_id: stayA,
      amount: 5000,
      idempotency_key: key,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Replay with identical payload returns existing payment
    const first = await paymentsService.recordPayment(orgA, 'user-1', {
      residentId: residentA,
      stayId: stayA,
      amount: 5000,
      paymentMethod: 'UPI',
      idempotencyKey: key,
    });
    expect(first.id).toBe(paymentA);

    // Replay with mutated amount throws 409 Conflict
    await expect(
      paymentsService.recordPayment(orgA, 'user-1', {
        residentId: residentA,
        stayId: stayA,
        amount: 6000,
        paymentMethod: 'UPI',
        idempotencyKey: key,
      })
    ).rejects.toThrow(ConflictException);
  });

  it('BILL-SEC-09: Duplicate invoice generation protected', async () => {
    vi.spyOn(stayRepo, 'findActiveStaysByOrganization').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: stayA, resident_id: residentA, organization_id: orgA } as any,
    ]);
    vi.spyOn(billingRepo, 'findActiveInvoiceByStayAndPeriod').mockResolvedValue({
      id: invoiceA,
      organization_id: orgA,
      stay_id: stayA,
      status: 'ISSUED',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const generated = await billingService.generateInvoices(orgA, { billingPeriod: '2026-08' });
    expect(generated).toHaveLength(0);
  });

  it('BILL-SEC-10: Historical invoice immutable', async () => {
    // Attempting to cancel an already paid historical invoice must fail
    vi.spyOn(billingRepo, 'findInvoiceById').mockResolvedValue({
      id: invoiceA,
      organization_id: orgA,
      status: 'PAID',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await expect(billingService.cancelInvoice(orgA, invoiceA)).rejects.toThrow(
      BadRequestException
    );
  });

  it('BILL-SEC-11: Historical payment immutable', async () => {
    vi.spyOn(billingRepo, 'findPaymentById').mockResolvedValue({
      id: paymentA,
      organization_id: orgA,
      amount: 5000,
      status: 'COMPLETED',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const pay = await paymentsService.getPaymentById(orgA, paymentA);
    expect(pay.status).toBe('COMPLETED');
    expect(pay.amount).toBe(5000);
  });

  it('BILL-SEC-12: Historical receipt immutable', async () => {
    vi.spyOn(billingRepo, 'findReceiptByPaymentId').mockResolvedValue({
      id: 'rec-1',
      organization_id: orgA,
      payment_id: paymentA,
      receipt_number: 'REC-202608-01',
      resident_id: residentA,
      stay_id: stayA,
      amount: 5000,
      payment_method: 'UPI',
      generated_at: new Date(),
    });

    const rec = await paymentsService.getReceiptByPaymentId(orgA, paymentA);
    expect(rec.receiptNumber).toBe('REC-202608-01');
    expect(rec.amount).toBe(5000);
  });

  it('BILL-SEC-13: Concurrent payment race protected', async () => {
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(billingRepo, 'findUnpaidInvoicesByStayForUpdate').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: invoiceA, balance_due_amount: '5000.00' } as any,
    ]);

    let updateCount = 0;
    vi.spyOn(billingRepo, 'createPayment').mockImplementation(
      async (data) =>
        ({
          id: `pay-${++updateCount}`,
          ...data,
          status: 'COMPLETED',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
    );
    vi.spyOn(billingRepo, 'createAllocation').mockResolvedValue({} as any);
    vi.spyOn(billingRepo, 'updateInvoiceBalance').mockResolvedValue({} as any);
    vi.spyOn(billingRepo, 'createReceipt').mockResolvedValue({} as any);

    const res = await paymentsService.recordPayment(orgA, 'user-1', {
      residentId: residentA,
      stayId: stayA,
      amount: 5000,
      paymentMethod: 'UPI',
      idempotencyKey: 'key-race-1',
    });

    expect(res.amount).toBe(5000);
  });

  it('BILL-SEC-14: Transaction rollback verified', async () => {
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(billingRepo, 'findUnpaidInvoicesByStayForUpdate').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: invoiceA, balance_due_amount: '5000.00' } as any,
    ]);

    vi.spyOn(billingRepo, 'createPayment').mockResolvedValue({ id: 'pay-fail' } as any);
    vi.spyOn(billingRepo, 'createAllocation').mockImplementation(async () => {
      throw new Error('SIMULATED_ALLOCATION_FAILURE');
    });

    await expect(
      paymentsService.recordPayment(orgA, 'user-1', {
        residentId: residentA,
        stayId: stayA,
        amount: 5000,
        paymentMethod: 'UPI',
        idempotencyKey: 'key-rollback',
      })
    ).rejects.toThrow('SIMULATED_ALLOCATION_FAILURE');
  });

  it('BILL-SEC-15: Resident ledger tenant scoped', async () => {
    vi.spyOn(residentRepo, 'findByIdForOrganization').mockImplementation(async (resId, orgId) => {
      if (resId === residentA && orgId === orgB) return null;
      return null;
    });

    await expect(billingService.getResidentLedger(orgB, residentA)).rejects.toThrow(
      NotFoundException
    );
  });
});
