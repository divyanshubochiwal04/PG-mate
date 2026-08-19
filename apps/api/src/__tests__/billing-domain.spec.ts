import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  KyselyBillingRepository,
  KyselyCommercialRepository,
  KyselyMessRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import { BillingService } from '../modules/billing/billing.service';
import { PaymentsService } from '../modules/billing/payments.service';

describe('Billing & Payments Financial Integrity Domain Specification', () => {
  let billingService: BillingService;
  let paymentsService: PaymentsService;
  let billingRepo: KyselyBillingRepository;
  let commercialRepo: KyselyCommercialRepository;
  let messRepo: KyselyMessRepository;
  let stayRepo: KyselyStayRepository;
  let unitOfWork: KyselyUnitOfWork;

  const mockOrgId = 'org-11111111-1111-1111-1111-111111111111';
  const mockResidentId = 'res-22222222-2222-2222-2222-222222222222';
  const mockStayId = 'stay-33333333-3333-3333-3333-333333333333';
  const mockStayId2 = 'stay-44444444-4444-4444-4444-444444444444';

  beforeEach(() => {
    const dummyDb = {} as unknown;
    billingRepo = new KyselyBillingRepository(dummyDb as never);
    commercialRepo = new KyselyCommercialRepository(dummyDb as never);
    messRepo = new KyselyMessRepository(dummyDb as never);
    stayRepo = new KyselyStayRepository(dummyDb as never);
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
    (billingService as unknown as Record<string, unknown>)['unitOfWork'] = unitOfWork;

    paymentsService = new PaymentsService();
    (paymentsService as unknown as Record<string, unknown>)['billingRepo'] = billingRepo;
    (paymentsService as unknown as Record<string, unknown>)['unitOfWork'] = unitOfWork;
  });

  it('1. Services must be defined', () => {
    expect(billingService).toBeDefined();
    expect(paymentsService).toBeDefined();
  });

  it('2. Exact integer paise money arithmetic check', () => {
    const totalAmount = 11300.5;
    const totalPaise = Math.round(totalAmount * 100);
    expect(totalPaise).toBe(1130050);

    const paymentAmount = 8000.0;
    const paymentPaise = Math.round(paymentAmount * 100);
    const remainingPaise = totalPaise - paymentPaise;
    expect(remainingPaise).toBe(330050);
    expect(remainingPaise / 100).toBe(3300.5);
  });

  it('3. Duplicate invoice period protection skips duplicate active invoice generation', async () => {
    vi.spyOn(stayRepo, 'findActiveStaysByOrganization').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: mockStayId, resident_id: mockResidentId, organization_id: mockOrgId } as any,
    ]);
    vi.spyOn(billingRepo, 'findActiveInvoiceByStayAndPeriod').mockResolvedValue({
      id: 'inv-existing',
      organization_id: mockOrgId,
      stay_id: mockStayId,
      resident_id: mockResidentId,
      status: 'ISSUED',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const generated = await billingService.generateInvoices(mockOrgId);
    expect(generated).toHaveLength(0);
  });

  it('4. Invoice generation incorporates transactional facilities and charges', async () => {
    vi.spyOn(stayRepo, 'findActiveStaysByOrganization').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: mockStayId, resident_id: mockResidentId, organization_id: mockOrgId } as any,
    ]);
    vi.spyOn(billingRepo, 'findActiveInvoiceByStayAndPeriod').mockResolvedValue(null);
    vi.spyOn(commercialRepo, 'findActiveAgreement').mockResolvedValue({
      base_rent_amount: '10000.00',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.spyOn(commercialRepo, 'findActiveFacilities').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { facility_type: 'WIFI', monthly_charge: '500.00' } as any,
    ]);
    vi.spyOn(commercialRepo, 'findActiveCharges').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { description: 'Parking', amount: '1000.00' } as any,
    ]);
    vi.spyOn(messRepo, 'findActiveSubscriptionByStay').mockResolvedValue(null);

    vi.spyOn(billingRepo, 'createInvoice').mockImplementation(
      async (data) =>
        ({
          id: 'inv-created',
          ...data,
          created_at: new Date(),
          updated_at: new Date(),
          issued_at: new Date(),
          cancelled_at: null,
          subtotal_amount: data.subtotal_amount,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: data.total_amount,
          paid_amount: 0,
          balance_due_amount: data.total_amount,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
    );

    vi.spyOn(billingRepo, 'createInvoiceItems').mockImplementation(async (items) =>
      items.map(
        (it, idx) =>
          ({
            id: `item-${idx}`,
            ...it,
            unit_amount: it.unit_amount,
            total_amount: it.total_amount,
          }) as any
      )
    );

    const generated = await billingService.generateInvoices(mockOrgId);
    expect(generated).toHaveLength(1);
    expect(generated[0]?.totalAmount).toBe(11500);
    expect(generated[0]?.items).toHaveLength(3);
  });

  it('5. Cancellation allowed for ISSUED invoice', async () => {
    vi.spyOn(billingRepo, 'findInvoiceById').mockResolvedValue({
      id: 'inv-1',
      organization_id: mockOrgId,
      status: 'ISSUED',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.spyOn(billingRepo, 'findAllocationsByInvoiceId').mockResolvedValue([]);
    vi.spyOn(billingRepo, 'cancelInvoice').mockResolvedValue({
      id: 'inv-1',
      organization_id: mockOrgId,
      status: 'CANCELLED',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.spyOn(billingRepo, 'findInvoiceItemsByInvoiceId').mockResolvedValue([]);

    const res = await billingService.cancelInvoice(mockOrgId, 'inv-1');
    expect(res.status).toBe('CANCELLED');
  });

  it('6. Cancellation rejected for PAID invoice', async () => {
    vi.spyOn(billingRepo, 'findInvoiceById').mockResolvedValue({
      id: 'inv-1',
      organization_id: mockOrgId,
      status: 'PAID',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await expect(billingService.cancelInvoice(mockOrgId, 'inv-1')).rejects.toThrow(
      BadRequestException
    );
  });

  it('7. Cancellation rejected for PARTIALLY_PAID invoice', async () => {
    vi.spyOn(billingRepo, 'findInvoiceById').mockResolvedValue({
      id: 'inv-1',
      organization_id: mockOrgId,
      status: 'PARTIALLY_PAID',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await expect(billingService.cancelInvoice(mockOrgId, 'inv-1')).rejects.toThrow(
      BadRequestException
    );
  });

  it('8. Cancellation rejected if payment allocations exist', async () => {
    vi.spyOn(billingRepo, 'findInvoiceById').mockResolvedValue({
      id: 'inv-1',
      organization_id: mockOrgId,
      status: 'ISSUED',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.spyOn(billingRepo, 'findAllocationsByInvoiceId').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'alloc-1', invoice_id: 'inv-1', amount: 100 } as any,
    ]);

    await expect(billingService.cancelInvoice(mockOrgId, 'inv-1')).rejects.toThrow(
      BadRequestException
    );
  });

  it('9. Same idempotency key with identical payload returns existing payment (idempotent replay)', async () => {
    const key = 'idemp-key-1';
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue({
      id: 'pay-1',
      organization_id: mockOrgId,
      resident_id: mockResidentId,
      stay_id: mockStayId,
      payment_number: 'PAY-1',
      amount: 5000,
      payment_method: 'UPI',
      payment_date: '2026-08-12',
      status: 'COMPLETED',
      idempotency_key: key,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const res = await paymentsService.recordPayment(mockOrgId, 'user-1', {
      residentId: mockResidentId,
      stayId: mockStayId,
      amount: 5000,
      paymentMethod: 'UPI',
      idempotencyKey: key,
    });

    expect(res.id).toBe('pay-1');
    expect(res.amount).toBe(5000);
  });

  it('10. Same idempotency key with different amount throws 409 Conflict', async () => {
    const key = 'idemp-key-1';
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue({
      id: 'pay-1',
      organization_id: mockOrgId,
      resident_id: mockResidentId,
      stay_id: mockStayId,
      amount: 5000,
      idempotency_key: key,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await expect(
      paymentsService.recordPayment(mockOrgId, 'user-1', {
        residentId: mockResidentId,
        stayId: mockStayId,
        amount: 6000, // Different amount!
        paymentMethod: 'UPI',
        idempotencyKey: key,
      })
    ).rejects.toThrow(ConflictException);
  });

  it('11. Same idempotency key with different stay throws 409 Conflict', async () => {
    const key = 'idemp-key-1';
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue({
      id: 'pay-1',
      organization_id: mockOrgId,
      resident_id: mockResidentId,
      stay_id: mockStayId,
      amount: 5000,
      idempotency_key: key,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    await expect(
      paymentsService.recordPayment(mockOrgId, 'user-1', {
        residentId: mockResidentId,
        stayId: mockStayId2, // Different stay!
        amount: 5000,
        paymentMethod: 'UPI',
        idempotencyKey: key,
      })
    ).rejects.toThrow(ConflictException);
  });

  it('12. Overpayment exceeding unpaid balance is rejected', async () => {
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(billingRepo, 'findUnpaidInvoicesByStayForUpdate').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'inv-1', balance_due_amount: '4000.00' } as any,
    ]);

    await expect(
      paymentsService.recordPayment(mockOrgId, 'user-1', {
        residentId: mockResidentId,
        stayId: mockStayId,
        amount: 5000, // Exceeds 4000 due!
        paymentMethod: 'CASH',
        idempotencyKey: 'key-overpay',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('13. Zero or negative payment amount is rejected', async () => {
    await expect(
      paymentsService.recordPayment(mockOrgId, 'user-1', {
        residentId: mockResidentId,
        stayId: mockStayId,
        amount: 0,
        paymentMethod: 'CASH',
        idempotencyKey: 'key-zero',
      })
    ).rejects.toThrow(BadRequestException);

    await expect(
      paymentsService.recordPayment(mockOrgId, 'user-1', {
        residentId: mockResidentId,
        stayId: mockStayId,
        amount: -500,
        paymentMethod: 'CASH',
        idempotencyKey: 'key-neg',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('14. Valid payment records payment, allocation, and receipt atomically', async () => {
    vi.spyOn(billingRepo, 'findByIdempotencyKey').mockResolvedValue(null);
    vi.spyOn(billingRepo, 'findUnpaidInvoicesByStayForUpdate').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: 'inv-1', balance_due_amount: '5000.00' } as any,
    ]);
    vi.spyOn(billingRepo, 'createPayment').mockImplementation(
      async (data) =>
        ({
          id: 'pay-1',
          ...data,
          created_at: new Date(),
          status: 'COMPLETED',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
    );
    vi.spyOn(billingRepo, 'createAllocation').mockResolvedValue({
      id: 'alloc-1',
      organization_id: mockOrgId,
      payment_id: 'pay-1',
      invoice_id: 'inv-1',
      amount: 5000,
      allocated_at: new Date(),
    });
    vi.spyOn(billingRepo, 'updateInvoiceBalance').mockResolvedValue({} as never);
    vi.spyOn(billingRepo, 'createReceipt').mockResolvedValue({
      id: 'rec-1',
      organization_id: mockOrgId,
      payment_id: 'pay-1',
      receipt_number: 'REC-1',
      resident_id: mockResidentId,
      stay_id: mockStayId,
      amount: 5000,
      payment_method: 'UPI',
      generated_at: new Date(),
    });

    const res = await paymentsService.recordPayment(mockOrgId, 'user-1', {
      residentId: mockResidentId,
      stayId: mockStayId,
      amount: 5000,
      paymentMethod: 'UPI',
      idempotencyKey: 'key-valid',
    });

    expect(res.id).toBe('pay-1');
    expect(res.amount).toBe(5000);
    expect(billingRepo.createAllocation).toHaveBeenCalledWith(
      expect.objectContaining({ payment_id: 'pay-1', invoice_id: 'inv-1', amount: 5000 }),
      expect.anything()
    );
    expect(billingRepo.createReceipt).toHaveBeenCalledWith(
      expect.objectContaining({ payment_id: 'pay-1', amount: 5000 }),
      expect.anything()
    );
  });

  it('15. Resident financial summary computes exact integer paise totals', async () => {
    vi.spyOn(stayRepo, 'findActiveByResident').mockResolvedValue({
      id: mockStayId,
      resident_id: mockResidentId,
      organization_id: mockOrgId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.spyOn(commercialRepo, 'findActiveAgreement').mockResolvedValue({
      base_rent_amount: '12000.50',
      security_deposit_amount: '24000.00',
      security_deposit_status: 'PAID',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.spyOn(commercialRepo, 'findActiveFacilities').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { monthly_charge: '750.25' } as any,
    ]);
    vi.spyOn(commercialRepo, 'findActiveCharges').mockResolvedValue([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { amount: '300.00' } as any,
    ]);
    vi.spyOn(messRepo, 'findActiveSubscriptionByStay').mockResolvedValue({
      billing_mode: 'MONTHLY',
      price_at_subscription: '2500.00',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.spyOn(billingRepo, 'findInvoicesByOrganization').mockResolvedValue({
      items: [
        {
          id: 'inv-1',
          status: 'ISSUED',
          balance_due_amount: '15550.75',
          paid_amount: '0.00',
        } as any,
      ],
      total: 1,
    });

    const summary = await billingService.getResidentSummary(mockOrgId, mockResidentId);
    expect(summary.baseRent).toBe(12000.5);
    expect(summary.facilitiesCharge).toBe(750.25);
    expect(summary.extraCharges).toBe(300);
    expect(summary.messCharge).toBe(2500);
    expect(summary.totalMonthlyBilling).toBe(15550.75);
    expect(summary.netDue).toBe(15550.75);
  });

  it('16. Non-existent resident summary throws NotFoundException', async () => {
    vi.spyOn(stayRepo, 'findActiveByResident').mockResolvedValue(null);
    await expect(billingService.getResidentSummary(mockOrgId, 'res-unknown')).rejects.toThrow(
      NotFoundException
    );
  });

  it('17. Non-existent invoice lookup throws NotFoundException', async () => {
    vi.spyOn(billingRepo, 'findInvoiceById').mockResolvedValue(null);
    await expect(billingService.getInvoiceById(mockOrgId, 'inv-unknown')).rejects.toThrow(
      NotFoundException
    );
  });

  it('18. Non-existent receipt by payment lookup throws NotFoundException', async () => {
    vi.spyOn(billingRepo, 'findReceiptByPaymentId').mockResolvedValue(null);
    await expect(paymentsService.getReceiptByPaymentId(mockOrgId, 'pay-unknown')).rejects.toThrow(
      NotFoundException
    );
  });
});
