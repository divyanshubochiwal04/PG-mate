import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  dbService,
  KyselyBillingRepository,
  KyselyCommercialRepository,
  KyselyMessRepository,
  KyselyNotificationRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { DatabaseSchema, InvoiceRow, PaymentRow, Transaction } from '@m-square/database';
import type {
  PaymentDto,
  PaymentMethodDto,
  PaymentStatusDto,
  ReceiptDto,
  RecordPaymentDto,
} from '@m-square/contracts';

const isValidIdFormat = (id?: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  return trimmed.length >= 8 && (trimmed.includes('-') || /^[0-9a-fA-F]{24,}$/.test(trimmed));
};

function toPaise(value: number | string | null | undefined): number {
  return Math.round(Number(value ?? 0) * 100);
}

@Injectable()
export class PaymentsService {
  private readonly db = dbService.db;
  private readonly billingRepo = new KyselyBillingRepository(this.db);
  private readonly commercialRepo = new KyselyCommercialRepository(this.db);
  private readonly messRepo = new KyselyMessRepository(this.db);
  private readonly stayRepo = new KyselyStayRepository(this.db);
  private readonly notificationRepo = new KyselyNotificationRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);

  public async recordPayment(
    organizationId: string,
    receivedByUserId: string | null,
    dto: RecordPaymentDto
  ): Promise<PaymentDto> {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    if (!isValidIdFormat(dto.residentId)) {
      throw new BadRequestException(`Invalid residentId format: "${dto.residentId}"`);
    }

    return await this.unitOfWork.runInTransaction(async (trx: Transaction<DatabaseSchema>) => {
      const repo = this.billingRepo;

      // 1. Check idempotency key
      const existing = await repo.findByIdempotencyKey(organizationId, dto.idempotencyKey, trx);
      if (existing) {
        if (
          Number(existing.amount) !== dto.amount ||
          existing.resident_id !== dto.residentId ||
          (dto.stayId && existing.stay_id !== dto.stayId)
        ) {
          throw new ConflictException(
            'Idempotency key already exists for a different payment payload'
          );
        }
        return this.mapPayment(existing);
      }

      let unpaidInvoices: InvoiceRow[] = [];
      let targetStayId = dto.stayId;

      if (dto.invoiceId) {
        const targetInvoice = await repo.findInvoiceById(dto.invoiceId, organizationId, trx);
        if (!targetInvoice) {
          throw new NotFoundException(`Invoice "${dto.invoiceId}" not found`);
        }
        if (targetInvoice.resident_id !== dto.residentId) {
          throw new BadRequestException(
            `Invoice "${dto.invoiceId}" does not belong to resident "${dto.residentId}"`
          );
        }
        if (['PAID', 'CANCELLED'].includes(targetInvoice.status)) {
          throw new BadRequestException(
            `Invoice with status ${targetInvoice.status} cannot accept payment`
          );
        }
        targetStayId = targetInvoice.stay_id;
        unpaidInvoices = [targetInvoice];
      } else {
        if (!isValidIdFormat(targetStayId)) {
          const activeStay = await this.stayRepo.findActiveByResident(dto.residentId, organizationId);
          if (!activeStay) {
            throw new NotFoundException(
              `No active stay found for resident "${dto.residentId}" to record payment against.`
            );
          }
          targetStayId = activeStay.id;
        }

        unpaidInvoices = await repo.findUnpaidInvoicesByStayForUpdate(
          organizationId,
          targetStayId!,
          trx
        );

        if (unpaidInvoices.length === 0) {
          const now = new Date();
          const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const periodEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          const dueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

          const existingInvoice = await repo.findActiveInvoiceByStayAndPeriod(
            organizationId,
            targetStayId!,
            periodStart,
            trx
          );

          if (!existingInvoice) {
            const agreement = await this.commercialRepo.findActiveAgreement(
              organizationId,
              targetStayId!,
              trx
            );
            if (agreement) {
              const facilities = await this.commercialRepo.findActiveFacilities(
                organizationId,
                targetStayId!,
                trx
              );
              const charges = await this.commercialRepo.findActiveCharges(
                organizationId,
                targetStayId!,
                trx
              );
              const messSub = await this.messRepo.findActiveSubscriptionByStay(
                organizationId,
                targetStayId!,
                trx
              );

              let subtotalPaise = toPaise(agreement.base_rent_amount);
              const items: {
                organization_id: string;
                invoice_id: string;
                charge_type: 'BASE_RENT' | 'FACILITY' | 'MESS' | 'ADDITIONAL_CHARGE';
                description: string;
                unit_amount: number;
                quantity: number;
                total_amount: number;
              }[] = [
                {
                  organization_id: organizationId,
                  invoice_id: '',
                  charge_type: 'BASE_RENT',
                  description: 'Monthly Base Rent',
                  unit_amount: Number(agreement.base_rent_amount),
                  quantity: 1,
                  total_amount: Number(agreement.base_rent_amount),
                },
              ];

              for (const f of facilities) {
                subtotalPaise += toPaise(f.monthly_charge);
                items.push({
                  organization_id: organizationId,
                  invoice_id: '',
                  charge_type: 'FACILITY',
                  description: `Facility Fee (${f.facility_type})`,
                  unit_amount: Number(f.monthly_charge),
                  quantity: 1,
                  total_amount: Number(f.monthly_charge),
                });
              }

              for (const c of charges) {
                subtotalPaise += toPaise(c.amount);
                items.push({
                  organization_id: organizationId,
                  invoice_id: '',
                  charge_type: 'ADDITIONAL_CHARGE',
                  description: c.description,
                  unit_amount: Number(c.amount),
                  quantity: 1,
                  total_amount: Number(c.amount),
                });
              }

              if (messSub && messSub.billing_mode === 'MONTHLY') {
                subtotalPaise += toPaise(messSub.price_at_subscription);
                items.push({
                  organization_id: organizationId,
                  invoice_id: '',
                  charge_type: 'MESS',
                  description: 'Monthly Mess Plan Subscription',
                  unit_amount: Number(messSub.price_at_subscription),
                  quantity: 1,
                  total_amount: Number(messSub.price_at_subscription),
                });
              }

              const totalAmount = subtotalPaise / 100;
              const invNum = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${targetStayId!.slice(0, 5).toUpperCase()}`;

              const invRow = await repo.createInvoice(
                {
                  organization_id: organizationId,
                  resident_id: dto.residentId,
                  stay_id: targetStayId!,
                  invoice_number: invNum,
                  billing_period_start: periodStart,
                  billing_period_end: periodEnd,
                  due_date: dueDate,
                  subtotal_amount: totalAmount,
                  total_amount: totalAmount,
                  balance_due_amount: totalAmount,
                  status: 'ISSUED',
                },
                trx
              );

              items.forEach((it) => (it.invoice_id = invRow.id));
              await repo.createInvoiceItems(items, trx);

              unpaidInvoices = await repo.findUnpaidInvoicesByStayForUpdate(
                organizationId,
                targetStayId!,
                trx
              );
            }
          }
        }
      }

      const finalStayId = targetStayId!;

      // Overpayment Protection
      const totalDuePaise = unpaidInvoices.reduce(
        (sum, inv) => sum + toPaise(inv.balance_due_amount),
        0
      );
      const paymentPaise = toPaise(dto.amount);
      if (paymentPaise > totalDuePaise) {
        throw new BadRequestException('Payment amount exceeds outstanding balance');
      }

      // Create payment record
      const now = new Date();
      const payNum = `PAY-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentDateStr = dto.paymentDate || now.toISOString().split('T')[0];

      const payment = await repo.createPayment(
        {
          organization_id: organizationId,
          resident_id: dto.residentId,
          stay_id: finalStayId,
          payment_number: payNum,
          amount: dto.amount,
          payment_method: dto.paymentMethod,
          reference_number: dto.referenceNumber,
          payment_date: paymentDateStr,
          idempotency_key: dto.idempotencyKey,
          received_by_user_id: receivedByUserId,
          notes: dto.notes,
        },
        trx
      );

      // Allocate payment against unpaid invoices chronologically
      let remainingPaise = toPaise(dto.amount);
      for (const invoice of unpaidInvoices) {
        if (remainingPaise <= 0) break;
        const duePaise = toPaise(invoice.balance_due_amount);
        const allocPaise = Math.min(remainingPaise, duePaise);
        const allocAmount = allocPaise / 100;

        await repo.createAllocation(
          {
            organization_id: organizationId,
            payment_id: payment.id,
            invoice_id: invoice.id,
            amount: allocAmount,
          },
          trx
        );

        await repo.updateInvoiceBalance(invoice.id, organizationId, allocAmount, trx);
        remainingPaise -= allocPaise;
      }

      // Create Receipt record
      const recNum = `REC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${payment.id.slice(0, 5).toUpperCase()}`;
      await repo.createReceipt(
        {
          organization_id: organizationId,
          payment_id: payment.id,
          receipt_number: recNum,
          resident_id: dto.residentId,
          stay_id: finalStayId,
          amount: dto.amount,
          payment_method: dto.paymentMethod,
        },
        trx
      );

      await this.notificationRepo.createIfNotExists(
        organizationId,
        {
          type: 'PAYMENT_RECEIVED',
          severity: 'SUCCESS',
          title: 'Payment Received',
          message: `Payment of ₹${Number(dto.amount).toLocaleString('en-IN')} received. Receipt: ${recNum}`,
          entity_type: 'PAYMENT',
          entity_id: payment.id,
          action_route: `/(owner)/billing/payments`,
          metadata: { paymentId: payment.id, receiptNumber: recNum, amount: dto.amount },
          dedupe_key: `PAYMENT_RECEIVED:${payment.id}`,
          status: 'UNREAD',
          read_at: null,
          resolved_at: null,
          expires_at: null,
        },
        trx
      );

      return this.mapPayment(payment);
    });
  }

  public async getPayments(
    organizationId: string,
    page = 1,
    pageSize = 20
  ): Promise<{ items: PaymentDto[]; total: number }> {
    const { items, total } = await this.billingRepo.findPaymentsByOrganization(
      organizationId,
      page,
      pageSize
    );
    return { items: items.map((p) => this.mapPayment(p)), total };
  }

  public async getPaymentById(organizationId: string, paymentId: string): Promise<PaymentDto> {
    const payment = await this.billingRepo.findPaymentById(paymentId, organizationId);
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }
    return this.mapPayment(payment);
  }

  public async getReceiptByPaymentId(
    organizationId: string,
    paymentId: string
  ): Promise<ReceiptDto> {
    const receipt = await this.billingRepo.findReceiptByPaymentId(paymentId, organizationId);
    if (!receipt) {
      throw new NotFoundException(`Receipt for payment ${paymentId} not found`);
    }
    return {
      id: receipt.id,
      organizationId: receipt.organization_id,
      paymentId: receipt.payment_id,
      receiptNumber: receipt.receipt_number,
      residentId: receipt.resident_id,
      stayId: receipt.stay_id,
      amount: Number(receipt.amount),
      paymentMethod: receipt.payment_method as PaymentMethodDto,
      generatedAt: receipt.generated_at ? new Date(receipt.generated_at).toISOString() : '',
    };
  }

  private mapPayment(row: PaymentRow): PaymentDto {
    return {
      id: row.id,
      organizationId: row.organization_id,
      residentId: row.resident_id,
      stayId: row.stay_id,
      paymentNumber: row.payment_number,
      amount: Number(row.amount),
      paymentMethod: row.payment_method as PaymentMethodDto,
      referenceNumber: row.reference_number,
      paymentDate: row.payment_date,
      status: row.status as PaymentStatusDto,
      idempotencyKey: row.idempotency_key,
      receivedByUserId: row.received_by_user_id,
      notes: row.notes,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    };
  }
}
