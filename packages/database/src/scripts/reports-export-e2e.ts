import { dbService } from '../connection/database';
import { KyselyOrganizationRepository } from '../repositories/organization.repository';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyBedRepository } from '../repositories/bed.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { KyselyBedAllocationRepository } from '../repositories/bed-allocation.repository';
import { KyselyBillingRepository } from '../repositories/billing.repository';
import { KyselyMessRepository } from '../repositories/mess.repository';
import { KyselyMessInventoryRepository } from '../repositories/mess-inventory.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';

import { KyselyResidentReportingRepository } from '../repositories/reporting-resident.repository';
import { KyselyOccupancyReportingRepository } from '../repositories/reporting-occupancy.repository';
import { KyselyBillingReportingRepository } from '../repositories/reporting-billing.repository';
import { KyselyMessReportingRepository } from '../repositories/reporting-mess.repository';
import { KyselyInventoryReportingRepository } from '../repositories/reporting-inventory.repository';
import { KyselyFinancialReportingRepository } from '../repositories/reporting-financial.repository';

async function runReportsExportE2E() {
  console.log('🚀 Starting Phase 5: Reports, Analytics & Export Center Physical PostgreSQL E2E...');

  const db = dbService.db;
  const orgRepo = new KyselyOrganizationRepository(db);
  const propRepo = new KyselyPropertyRepository(db);
  const bldgRepo = new KyselyBuildingRepository(db);
  const flrRepo = new KyselyFloorRepository(db);
  const rmRepo = new KyselyRoomRepository(db);
  const bdRepo = new KyselyBedRepository(db);
  const resRepo = new KyselyResidentRepository(db);
  const stayRepo = new KyselyStayRepository(db);
  const allocRepo = new KyselyBedAllocationRepository(db);
  const billRepo = new KyselyBillingRepository(db);
  const messRepo = new KyselyMessRepository(db);
  const invRepo = new KyselyMessInventoryRepository(db);
  const unitOfWork = new KyselyUnitOfWork(db);

  const resReportRepo = new KyselyResidentReportingRepository(db);
  const occReportRepo = new KyselyOccupancyReportingRepository(db);
  const billReportRepo = new KyselyBillingReportingRepository(db);
  const messReportRepo = new KyselyMessReportingRepository(db);
  const invReportRepo = new KyselyInventoryReportingRepository(db);
  const finReportRepo = new KyselyFinancialReportingRepository(db);

  const suffix = Math.random().toString(36).substring(2, 7);

  // 1. Scaffold Org A & Org B
  const orgA = await orgRepo.createOrganization({
    name: `Report Org A ${suffix}`,
    slug: `rpt-org-a-${suffix}`,
  });

  const orgB = await orgRepo.createOrganization({
    name: `Report Org B ${suffix}`,
    slug: `rpt-org-b-${suffix}`,
  });

  // Org A: Property & Building
  const propA = await propRepo.createForOrganization(orgA.id, {
    name: `Horizon Heights ${suffix}`,
    code: `HH-${suffix}`,
    addressLine1: '100 Tech Park',
    locality: 'Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560066',
  });

  const bldgA = await bldgRepo.createForOrganization(orgA.id, {
    propertyId: propA.id,
    name: 'Block A',
    code: 'BA',
  });

  const flrA = await flrRepo.createForOrganization(orgA.id, {
    buildingId: bldgA.id,
    name: '1st Floor',
    floorNumber: 1,
  });

  const rmA = await rmRepo.createForOrganization(orgA.id, {
    floorId: flrA.id,
    buildingId: bldgA.id,
    propertyId: propA.id,
    roomNumber: '101',
    roomType: 'DOUBLE',
    capacity: 2,
  });

  const bd1 = await bdRepo.createForOrganization(orgA.id, { roomId: rmA.id, bedNumber: '101-A' });
  const bd2 = await bdRepo.createForOrganization(orgA.id, { roomId: rmA.id, bedNumber: '101-B' });

  // Resident 1: Active Stay
  const res1 = await resRepo.createForOrganization(orgA.id, {
    firstName: 'Rahul',
    lastName: 'Sharma',
    gender: 'MALE',
    phone: '9888888881',
    email: `rahul-${suffix}@test.com`,
    residentCode: `RES-RPT-1-${suffix}`,
  });

  const stay1 = await stayRepo.createForOrganization(orgA.id, {
    residentId: res1.id,
    admissionDate: new Date('2026-08-01'),
    status: 'ACTIVE',
  });

  await allocRepo.createForOrganization(orgA.id, {
    stayId: stay1.id,
    bedId: bd1.id,
    startAt: new Date('2026-08-01'),
    status: 'ACTIVE',
  });
  await bdRepo.updateStatus(bd1.id, orgA.id, 'OCCUPIED');

  // Resident 2: Checked-Out Stay
  const res2 = await resRepo.createForOrganization(orgA.id, {
    firstName: 'Priya',
    lastName: 'Nair',
    gender: 'FEMALE',
    phone: '9888888882',
    email: `priya-${suffix}@test.com`,
    residentCode: `RES-RPT-2-${suffix}`,
  });

  const stay2 = await stayRepo.createForOrganization(orgA.id, {
    residentId: res2.id,
    admissionDate: new Date('2026-07-01'),
    status: 'ACTIVE',
  });
  await stayRepo.completeStay(stay2.id, orgA.id, new Date('2026-07-31'));

  // Financial Data: Invoice & Payment for Resident 1
  const inv1 = await billRepo.createInvoice({
    organization_id: orgA.id,
    stay_id: stay1.id,
    resident_id: res1.id,
    invoice_number: `INV-RPT-${suffix}`,
    billing_period_start: '2026-08-01',
    billing_period_end: '2026-08-31',
    due_date: '2026-08-10',
    subtotal_amount: 12000,
    total_amount: 12000,
    paid_amount: 5000,
    balance_due_amount: 7000,
    status: 'PARTIALLY_PAID',
  });

  const pay1 = await billRepo.createPayment({
    organization_id: orgA.id,
    stay_id: stay1.id,
    resident_id: res1.id,
    payment_number: `PAY-RPT-${suffix}`,
    amount: 5000,
    payment_method: 'UPI',
    reference_number: 'UPI999888',
    idempotency_key: `IK-RPT-${suffix}`,
    payment_date: '2026-08-02',
  });

  await billRepo.createReceipt({
    organization_id: orgA.id,
    payment_id: pay1.id,
    receipt_number: `REC-RPT-${suffix}`,
    resident_id: res1.id,
    stay_id: stay1.id,
    amount: 5000,
    payment_method: 'UPI',
  });

  // Mess Setup
  const messA = await messRepo.createMess({
    organization_id: orgA.id,
    name: `Central Mess ${suffix}`,
    code: `CM-${suffix}`,
    scope_type: 'CENTRAL',
    is_active: true,
  });

  const planA = await messRepo.createMealPlan({
    organization_id: orgA.id,
    mess_id: messA.id,
    name: 'Premium Meal Plan',
    billing_mode: 'MONTHLY',
    price: 5000,
    included_meal_types: 'ALL',
    is_active: true,
    description: null,
    version: 1,
  });

  const sub1 = await messRepo.createSubscription({
    organization_id: orgA.id,
    resident_id: res1.id,
    stay_id: stay1.id,
    mess_id: messA.id,
    meal_plan_id: planA.id,
    billing_mode: 'MONTHLY',
    price_at_subscription: 5000,
    start_date: '2026-08-01',
    end_date: null,
    status: 'ACTIVE',
  });

  const type1 = await messRepo.createMealType({
    organization_id: orgA.id,
    mess_id: messA.id,
    name: 'Lunch',
    start_time: '12:00',
    end_time: '14:00',
    display_order: 1,
    is_active: true,
  });

  await messRepo.recordConsumption({
    organization_id: orgA.id,
    subscription_id: sub1.id,
    resident_id: res1.id,
    stay_id: stay1.id,
    mess_id: messA.id,
    meal_type_id: type1.id,
    consumption_date: '2026-08-02',
    status: 'CONSUMED',
    notes: null,
  });

  // Inventory & Vendor & Expenses Setup
  const vendorA = await invRepo.createVendor({
    organization_id: orgA.id,
    name: `Fresh Farms ${suffix}`,
    phone: '9777777771',
    status: 'ACTIVE',
    notes: null,
    email: null,
    address: null,
  });

  const itemA = await invRepo.createInventoryItem({
    organization_id: orgA.id,
    mess_id: messA.id,
    name: `Basmati Rice ${suffix}`,
    category: 'GRAINS',
    unit: 'kg',
    current_stock: 50,
    minimum_stock: 10,
    reorder_level: 20,
    status: 'IN_STOCK',
  });

  const proc1 = await unitOfWork.runInTransaction(async (trx) => {
    return invRepo.createProcurement(
      {
        organization_id: orgA.id,
        mess_id: messA.id,
        vendor_id: vendorA.id,
        purchase_date: '2026-08-01',
        invoice_reference: `INV-VEND-${suffix}`,
        total_amount: 3000,
        notes: null,
      },
      [
        {
          inventory_item_id: itemA.id,
          quantity: 50,
          unit_price: 60,
          total_price: 3000,
        },
      ],
      trx
    );
  });

  await invRepo.createExpense({
    organization_id: orgA.id,
    mess_id: messA.id,
    category: 'GAS',
    amount: 1500,
    expense_date: '2026-08-02',
    vendor_id: vendorA.id,
    notes: 'Commercial Cylinder Refill',
    reference_no: null,
  });

  console.log('✅ Scaffolding complete for Org A & Org B');

  // STEP 1: Resident Report E2E
  const resReport = await resReportRepo.getResidentReport(orgA.id, {});
  if (!resReport || resReport.summary.totalResidents < 2) {
    throw new Error('STEP 1 Failed: Resident report total calculation mismatch');
  }
  if (resReport.summary.activeResidents < 1 || resReport.summary.checkedOutResidents < 1) {
    throw new Error('STEP 1 Failed: Resident status aggregation mismatch');
  }
  console.log('✅ STEP 1: Resident Report E2E verified');

  // STEP 2: Occupancy Report E2E
  const occReport = await occReportRepo.getOccupancyReport(orgA.id, {});
  if (!occReport || occReport.summary.totalBeds !== 2 || occReport.summary.occupiedBeds !== 1) {
    throw new Error('STEP 2 Failed: Occupancy report bed counts mismatch');
  }
  if (occReport.summary.occupancyPercentage !== 50) {
    throw new Error('STEP 2 Failed: Occupancy percentage calculation mismatch');
  }
  console.log('✅ STEP 2: Occupancy Report E2E verified');

  // STEP 3: Billing Report E2E
  const billReport = await billReportRepo.getBillingReport(orgA.id, {});
  if (!billReport || billReport.summary.totalInvoiced !== 12000 || billReport.summary.totalCollected !== 5000) {
    throw new Error('STEP 3 Failed: Billing report totals mismatch');
  }
  if (billReport.summary.totalOutstanding !== 7000) {
    throw new Error('STEP 3 Failed: Billing report outstanding balance mismatch');
  }
  console.log('✅ STEP 3: Billing Report E2E verified');

  // STEP 4: Collection Report E2E
  const collReport = await billReportRepo.getCollectionReport(orgA.id, {});
  if (!collReport || collReport.summary.totalCollected !== 5000 || collReport.summary.upiCollected !== 5000) {
    throw new Error('STEP 4 Failed: Collection report method breakdown mismatch');
  }
  if (collReport.rows.length !== 1 || collReport.rows[0].receiptNumber !== `REC-RPT-${suffix}`) {
    throw new Error('STEP 4 Failed: Receipt linkage mismatch in collection report');
  }
  console.log('✅ STEP 4: Collection Report E2E verified');

  // STEP 5: Outstanding Dues Report E2E
  const dueReport = await billReportRepo.getOutstandingReport(orgA.id, {});
  if (!dueReport || dueReport.summary.totalOutstandingAmount !== 7000 || dueReport.rows.length !== 1) {
    throw new Error('STEP 5 Failed: Outstanding dues report balance mismatch');
  }
  if (dueReport.rows[0].balanceDue !== 7000 || dueReport.rows[0].residentId !== res1.id) {
    throw new Error('STEP 5 Failed: Outstanding dues resident row mismatch');
  }
  console.log('✅ STEP 5: Outstanding Dues Report E2E verified');

  // STEP 6: Mess Report E2E
  const messReport = await messReportRepo.getMessReport(orgA.id, {});
  if (!messReport || messReport.summary.activeSubscriptions !== 1 || messReport.summary.totalMealConsumptions !== 1) {
    throw new Error('STEP 6 Failed: Mess report subscription & consumption mismatch');
  }
  console.log('✅ STEP 6: Mess Report E2E verified');

  // STEP 7: Inventory Report E2E
  const invReport = await invReportRepo.getInventoryReport(orgA.id, {});
  if (!invReport || invReport.summary.totalItems !== 1 || invReport.summary.inStockItems !== 1) {
    throw new Error('STEP 7 Failed: Inventory report stock status mismatch');
  }
  if (invReport.summary.totalProcurementValue !== 3000) {
    throw new Error('STEP 7 Failed: Inventory report procurement value mismatch');
  }
  console.log('✅ STEP 7: Inventory Report E2E verified');

  // STEP 8: Procurement Report E2E
  const procReport = await invReportRepo.getProcurementReport(orgA.id, {});
  if (!procReport || procReport.summary.procurementCount !== 1 || procReport.summary.totalProcurementAmount !== 3000) {
    throw new Error('STEP 8 Failed: Procurement report total amount mismatch');
  }
  console.log('✅ STEP 8: Procurement Report E2E verified');

  // STEP 9: Expense Report E2E
  const expReport = await finReportRepo.getExpenseReport(orgA.id, {});
  if (!expReport || expReport.summary.expenseCount !== 1 || expReport.summary.totalExpenses !== 1500) {
    throw new Error('STEP 9 Failed: Expense report total expenses mismatch');
  }
  if (expReport.categories.length !== 1 || expReport.categories[0].category !== 'GAS') {
    throw new Error('STEP 9 Failed: Expense report category breakdown mismatch');
  }
  console.log('✅ STEP 9: Expense Report E2E verified');

  // STEP 10: Property Performance Report E2E
  const perfReport = await finReportRepo.getPropertyPerformanceReport(orgA.id, {});
  if (!perfReport || perfReport.summary.totalBeds !== 2 || perfReport.summary.occupiedBeds !== 1) {
    throw new Error('STEP 10 Failed: Property performance report bed counts mismatch');
  }
  if (perfReport.summary.totalCollected !== 5000 || perfReport.summary.totalExpenses !== 1500) {
    throw new Error('STEP 10 Failed: Property performance financial aggregate mismatch');
  }
  if (perfReport.summary.totalNetCashFlow !== 3500) {
    throw new Error('STEP 10 Failed: Property performance net cash flow calculation mismatch');
  }
  console.log('✅ STEP 10: Property Performance Report E2E verified');

  // STEP 11: Cross-Tenant Isolation Verified Across All 10 Reports
  const crossRes = await resReportRepo.getResidentReport(orgB.id, {});
  const crossOcc = await occReportRepo.getOccupancyReport(orgB.id, {});
  const crossBill = await billReportRepo.getBillingReport(orgB.id, {});
  const crossColl = await billReportRepo.getCollectionReport(orgB.id, {});
  const crossDue = await billReportRepo.getOutstandingReport(orgB.id, {});
  const crossMess = await messReportRepo.getMessReport(orgB.id, {});
  const crossInv = await invReportRepo.getInventoryReport(orgB.id, {});
  const crossProc = await invReportRepo.getProcurementReport(orgB.id, {});
  const crossExp = await finReportRepo.getExpenseReport(orgB.id, {});
  const crossPerf = await finReportRepo.getPropertyPerformanceReport(orgB.id, {});

  if (
    crossRes.summary.totalResidents !== 0 ||
    crossOcc.summary.totalBeds !== 0 ||
    crossBill.summary.totalInvoiced !== 0 ||
    crossColl.summary.totalCollected !== 0 ||
    crossDue.summary.totalOutstandingAmount !== 0 ||
    crossMess.summary.activeSubscriptions !== 0 ||
    crossInv.summary.totalItems !== 0 ||
    crossProc.summary.procurementCount !== 0 ||
    crossExp.summary.expenseCount !== 0 ||
    crossPerf.summary.totalBeds !== 0
  ) {
    throw new Error('STEP 11 Failed: Cross-tenant data leak detected!');
  }
  console.log('✅ STEP 11: Cross-tenant isolation verified across all 10 reports');

  // STEP 12: Historical Immutability Verified
  const freshInv = await billRepo.findInvoiceById(inv1.id, orgA.id);
  const freshPay = await billRepo.findPaymentById(pay1.id, orgA.id);
  const freshSub = await messRepo.findSubscriptionById(orgA.id, sub1.id);
  const freshItem = await invRepo.findInventoryItemById(itemA.id, orgA.id);

  if (!freshInv || Number(freshInv.total_amount) !== 12000 || Number(freshInv.paid_amount) !== 5000) {
    throw new Error('STEP 12 Failed: Historical invoice mutated during reporting');
  }
  if (!freshPay || Number(freshPay.amount) !== 5000) {
    throw new Error('STEP 12 Failed: Historical payment mutated during reporting');
  }
  if (!freshSub || freshSub.status !== 'ACTIVE') {
    throw new Error('STEP 12 Failed: Historical mess subscription mutated during reporting');
  }
  if (!freshItem || Number(freshItem.current_stock) !== 50) {
    throw new Error('STEP 12 Failed: Historical stock ledger mutated during reporting');
  }
  console.log('✅ STEP 12: Historical data immutability verified');

  console.log('\n🎉 REPORTS & EXPORT CENTER E2E VERIFICATION PASSED 100%\n');
  await dbService.shutdown();
}

runReportsExportE2E()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ E2E Execution Failed:', err);
    await dbService.shutdown();
    process.exit(1);
  });
