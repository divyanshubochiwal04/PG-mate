import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  dbService,
  KyselyBillingRepository,
  KyselyCommercialRepository,
  KyselyMessRepository,
  KyselyResidentRepository,
  KyselyStayRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type {
  BillingConfigurationRow,
  DatabaseSchema,
  InvoiceItemRow,
  InvoiceRow,
  InvoiceStatus,
  Transaction,
} from '@m-square/database';
import type {
  BillingConfigDto,
  BillingInvoiceFilterDto,
  BillingOverviewMetricsDto,
  GenerateInvoicesDto,
  InvoiceDto,
  InvoicePaymentHistoryDto,
  PaymentMethodDto,
  ResidentBillingLedgerDto,
  ResidentFinancialSummaryDto,
  UpdateBillingConfigDto,
} from '@m-square/contracts';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toPaise(value: number | string | null | undefined): number {
  return Math.round(Number(value ?? 0) * 100);
}

@Injectable()
export class BillingService {
  private readonly db = dbService.db;
  private readonly billingRepo = new KyselyBillingRepository(this.db);
  private readonly commercialRepo = new KyselyCommercialRepository(this.db);
  private readonly messRepo = new KyselyMessRepository(this.db);
  private readonly stayRepo = new KyselyStayRepository(this.db);
  private readonly residentRepo = new KyselyResidentRepository(this.db);
  private readonly unitOfWork = new KyselyUnitOfWork(this.db);

  public async getConfig(organizationId: string): Promise<BillingConfigDto> {
    const config = await this.billingRepo.getConfig(organizationId);
    if (!config) {
      const created = await this.billingRepo.upsertConfig(organizationId, {});
      return this.mapConfig(created);
    }
    return this.mapConfig(config);
  }

  public async updateConfig(
    organizationId: string,
    dto: UpdateBillingConfigDto
  ): Promise<BillingConfigDto> {
    const updated = await this.billingRepo.upsertConfig(organizationId, dto);
    return this.mapConfig(updated);
  }

  public async getOverview(organizationId: string): Promise<BillingOverviewMetricsDto> {
    return await this.billingRepo.getFinancialOverviewMetrics(organizationId);
  }

  public async getInvoices(
    organizationId: string,
    query?: BillingInvoiceFilterDto
  ): Promise<{ items: InvoiceDto[]; total: number }> {
    const { items, total } = await this.billingRepo.findInvoicesByOrganization(organizationId, {
      search: query?.search,
      propertyId: query?.propertyId,
      buildingId: query?.buildingId,
      billingPeriod: query?.billingPeriod,
      status: query?.status as InvoiceStatus,
      residentId: query?.residentId,
      stayId: query?.stayId,
      page: query?.page ? Number(query.page) : 1,
      pageSize: query?.pageSize ? Number(query.pageSize) : 20,
    });

    const mapped = await Promise.all(
      items.map(async (inv) => {
        const itemRows = await this.billingRepo.findInvoiceItemsByInvoiceId(inv.id, organizationId);
        return this.mapInvoice(inv, itemRows);
      })
    );

    return { items: mapped, total };
  }

  public async getInvoiceById(organizationId: string, invoiceId: string): Promise<InvoiceDto> {
    const invoice = await this.billingRepo.findInvoiceById(invoiceId, organizationId);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }
    const itemRows = await this.billingRepo.findInvoiceItemsByInvoiceId(invoice.id, organizationId);
    const allocRows = await this.billingRepo.findInvoiceAllocationsWithPaymentAndReceipt(
      invoice.id,
      organizationId
    );

    const paymentHistory: InvoicePaymentHistoryDto[] = allocRows.map((a) => ({
      paymentId: a.paymentId,
      paymentNumber: a.paymentNumber,
      paymentDate: a.paymentDate,
      amount: Number(a.amount),
      allocatedAmount: Number(a.allocatedAmount),
      paymentMethod: a.paymentMethod as PaymentMethodDto,
      referenceNumber: a.referenceNumber,
      receiptNumber: a.receiptNumber,
    }));

    return this.mapInvoice(invoice, itemRows, paymentHistory);
  }

  public async generateInvoices(
    organizationId: string,
    dto?: GenerateInvoicesDto
  ): Promise<InvoiceDto[]> {
    return await this.unitOfWork.runInTransaction(async (trx: Transaction<DatabaseSchema>) => {
      const billingRepo = this.billingRepo;
      const commercialRepo = this.commercialRepo;
      const messRepo = this.messRepo;
      const stayRepo = this.stayRepo;

      let activeStays = await stayRepo.findActiveStaysByOrganization(organizationId, trx);

      if (dto?.stayId) {
        activeStays = activeStays.filter((s) => s.id === dto.stayId);
      }
      if (dto?.residentId) {
        activeStays = activeStays.filter((s) => s.resident_id === dto.residentId);
      }

      let year: number;
      let month: number;

      if (dto?.billingPeriod && /^\d{4}-\d{2}$/.test(dto.billingPeriod)) {
        const [yStr, mStr] = dto.billingPeriod.split('-');
        year = Number(yStr);
        month = Number(mStr);
      } else {
        const now = new Date();
        year = now.getFullYear();
        month = now.getMonth() + 1;
      }

      const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const config = await billingRepo.getConfig(organizationId, trx);
      const graceDays = config ? Number(config.grace_period_days) : 5;
      const startDateObj = new Date(periodStart);
      const dueDate = new Date(startDateObj.getTime() + graceDays * DAY_IN_MS)
        .toISOString()
        .split('T')[0];

      const generatedInvoices: InvoiceDto[] = [];

      for (const stay of activeStays) {
        const existingActiveInvoice = await billingRepo.findActiveInvoiceByStayAndPeriod(
          organizationId,
          stay.id,
          periodStart,
          trx
        );
        if (existingActiveInvoice) {
          continue;
        }

        const agreement = await commercialRepo.findActiveAgreement(organizationId, stay.id, trx);
        if (!agreement) continue;

        const facilities = await commercialRepo.findActiveFacilities(organizationId, stay.id, trx);
        const charges = await commercialRepo.findActiveCharges(organizationId, stay.id, trx);
        const messSub = await messRepo.findActiveSubscriptionByStay(organizationId, stay.id, trx);

        const items: {
          organization_id: string;
          invoice_id: string;
          charge_type: 'BASE_RENT' | 'FACILITY' | 'MESS' | 'ADDITIONAL_CHARGE';
          description: string;
          unit_amount: number;
          quantity: number;
          total_amount: number;
        }[] = [];

        let subtotalPaise = toPaise(agreement.base_rent_amount);
        items.push({
          organization_id: organizationId,
          invoice_id: '',
          charge_type: 'BASE_RENT',
          description: 'Monthly Base Rent',
          unit_amount: Number(agreement.base_rent_amount),
          quantity: 1,
          total_amount: Number(agreement.base_rent_amount),
        });

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
        const invNum = `INV-${year}${String(month).padStart(2, '0')}-${stay.id.slice(0, 5).toUpperCase()}`;

        const invRow = await billingRepo.createInvoice(
          {
            organization_id: organizationId,
            resident_id: stay.resident_id,
            stay_id: stay.id,
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
        const itemRows = await billingRepo.createInvoiceItems(items, trx);
        generatedInvoices.push(this.mapInvoice(invRow, itemRows));
      }

      return generatedInvoices;
    });
  }

  public async cancelInvoice(organizationId: string, invoiceId: string): Promise<InvoiceDto> {
    return await this.unitOfWork.runInTransaction(async (trx: Transaction<DatabaseSchema>) => {
      const billingRepo = this.billingRepo;
      const inv = await billingRepo.findInvoiceById(invoiceId, organizationId, trx);
      if (!inv) throw new NotFoundException(`Invoice ${invoiceId} not found`);

      if (['PARTIALLY_PAID', 'PAID', 'CANCELLED'].includes(inv.status)) {
        throw new BadRequestException(`Invoice with status ${inv.status} cannot be cancelled`);
      }

      const allocations = await billingRepo.findAllocationsByInvoiceId(
        organizationId,
        invoiceId,
        trx
      );
      if (allocations.length > 0) {
        throw new BadRequestException(
          'Invoice with existing payment allocations cannot be cancelled'
        );
      }

      const cancelled = await billingRepo.cancelInvoice(invoiceId, organizationId, trx);
      const itemRows = await billingRepo.findInvoiceItemsByInvoiceId(
        invoiceId,
        organizationId,
        trx
      );
      return this.mapInvoice(cancelled, itemRows);
    });
  }

  public async getResidentSummary(
    organizationId: string,
    residentId: string
  ): Promise<ResidentFinancialSummaryDto> {
    const activeStay = await this.stayRepo.findActiveByResident(residentId, organizationId);
    if (!activeStay) {
      throw new NotFoundException(`Active stay for resident ${residentId} not found`);
    }

    const agreement = await this.commercialRepo.findActiveAgreement(organizationId, activeStay.id);
    const facilities = await this.commercialRepo.findActiveFacilities(
      organizationId,
      activeStay.id
    );
    const charges = await this.commercialRepo.findActiveCharges(organizationId, activeStay.id);
    const messSub = await this.messRepo.findActiveSubscriptionByStay(organizationId, activeStay.id);

    const baseRentPaise = toPaise(agreement?.base_rent_amount);
    const facilitiesPaise = facilities.reduce((sum, f) => sum + toPaise(f.monthly_charge), 0);
    const extraChargesPaise = charges.reduce((sum, c) => sum + toPaise(c.amount), 0);
    const messPaise =
      messSub && messSub.billing_mode === 'MONTHLY' ? toPaise(messSub.price_at_subscription) : 0;

    const totalMonthlyBillingPaise =
      baseRentPaise + facilitiesPaise + extraChargesPaise + messPaise;

    const { items: invoices } = await this.billingRepo.findInvoicesByOrganization(organizationId, {
      residentId,
      stayId: activeStay.id,
      pageSize: 100,
    });

    const netDuePaise = invoices
      .filter((i) => i.status !== 'CANCELLED')
      .reduce((sum, i) => sum + toPaise(i.balance_due_amount), 0);

    const totalPaidPaise = invoices
      .filter((i) => i.status !== 'CANCELLED')
      .reduce((sum, i) => sum + toPaise(i.paid_amount), 0);

    return {
      residentId,
      stayId: activeStay.id,
      baseRent: baseRentPaise / 100,
      messCharge: messPaise / 100,
      facilitiesCharge: facilitiesPaise / 100,
      extraCharges: extraChargesPaise / 100,
      totalMonthlyBilling: totalMonthlyBillingPaise / 100,
      totalPaid: totalPaidPaise / 100,
      netDue: netDuePaise / 100,
      securityDepositAmount: toPaise(agreement?.security_deposit_amount) / 100,
      securityDepositStatus: agreement?.security_deposit_status || 'PENDING',
    };
  }

  public async getResidentLedger(
    organizationId: string,
    residentId: string
  ): Promise<ResidentBillingLedgerDto> {
    const resident = await this.residentRepo.findByIdForOrganization(residentId, organizationId);
    if (!resident) {
      throw new NotFoundException(`Resident ${residentId} not found`);
    }

    return await this.billingRepo.getResidentLedger(organizationId, residentId);
  }

  private mapConfig(row: BillingConfigurationRow): BillingConfigDto {
    return {
      id: row.id,
      organizationId: row.organization_id,
      gracePeriodDays: Number(row.grace_period_days),
      lateFeePerDay: Number(row.late_fee_per_day),
      defaultBillingCycle: row.default_billing_cycle,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    };
  }

  private mapInvoice(
    row: InvoiceRow & { residentName?: string; residentCode?: string },
    items: InvoiceItemRow[],
    payments?: InvoicePaymentHistoryDto[]
  ): InvoiceDto {
    return {
      id: row.id,
      organizationId: row.organization_id,
      residentId: row.resident_id,
      stayId: row.stay_id,
      invoiceNumber: row.invoice_number,
      billingPeriodStart: row.billing_period_start,
      billingPeriodEnd: row.billing_period_end,
      dueDate: row.due_date,
      subtotalAmount: Number(row.subtotal_amount),
      discountAmount: Number(row.discount_amount),
      taxAmount: Number(row.tax_amount),
      totalAmount: Number(row.total_amount),
      paidAmount: Number(row.paid_amount),
      balanceDueAmount: Number(row.balance_due_amount),
      status: row.status,
      issuedAt: row.issued_at ? new Date(row.issued_at).toISOString() : '',
      cancelledAt: row.cancelled_at ? new Date(row.cancelled_at).toISOString() : null,
      items: items.map((i) => ({
        id: i.id,
        organizationId: i.organization_id,
        invoiceId: i.invoice_id,
        chargeType: i.charge_type,
        description: i.description,
        unitAmount: Number(i.unit_amount),
        quantity: Number(i.quantity),
        totalAmount: Number(i.total_amount),
      })),
      payments,
      residentName: row.residentName,
      residentCode: row.residentCode,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
    };
  }
}
