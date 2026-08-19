import { dbService } from '../connection/database';
import { KyselyOrganizationRepository } from '../repositories/organization.repository';
import { KyselyUserRepository } from '../repositories/user.repository';
import { KyselyTaskRepository } from '../repositories/task.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { KyselyBillingRepository } from '../repositories/billing.repository';
import { KyselyMessInventoryRepository } from '../repositories/mess-inventory.repository';
import { KyselyMessRepository } from '../repositories/mess.repository';
import { KyselyNotificationRepository } from '../repositories/notification.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';
import { runTaskTransitionsAndIntegrityTests } from './task-e2e-helper';

async function runTaskE2E() {
  console.log('🚀 Starting Owner Task & Follow-Up Management E2E Physical PostgreSQL Verification...\n');

  const db = dbService.db;
  const orgRepo = new KyselyOrganizationRepository(db);
  const userRepo = new KyselyUserRepository(db);
  const taskRepo = new KyselyTaskRepository(db);
  const residentRepo = new KyselyResidentRepository(db);
  const stayRepo = new KyselyStayRepository(db);
  const billingRepo = new KyselyBillingRepository(db);
  const messInvRepo = new KyselyMessInventoryRepository(db);
  const messRepo = new KyselyMessRepository(db);
  const notifRepo = new KyselyNotificationRepository(db);
  const unitOfWork = new KyselyUnitOfWork(db);

  const suffix = Date.now().toString().slice(-6);

  // --- STEP 1: SCAFFOLD TENANTS & INFRASTRUCTURE ---
  const orgA = await orgRepo.createOrganization({
    name: `Org Task A ${suffix}`,
    slug: `org-task-a-${suffix}`,
  });
  const orgB = await orgRepo.createOrganization({
    name: `Org Task B ${suffix}`,
    slug: `org-task-b-${suffix}`,
  });

  const userA = await userRepo.create({
    email: `owner.a.${suffix}@example.com`,
    passwordHash: 'hash_a',
  });
  const userB = await userRepo.create({
    email: `owner.b.${suffix}@example.com`,
    passwordHash: 'hash_b',
  });

  console.log(`✅ Tenant Scaffolding Complete: Org A (${orgA.id}), Org B (${orgB.id})`);

  // Scaffold Operational Entities for Org A
  const residentA = await residentRepo.createForOrganization(orgA.id, {
    residentCode: `RES-TASK-${suffix}`,
    firstName: 'Rahul',
    lastName: 'Sharma',
    gender: 'MALE',
    email: `rahul.${suffix}@example.com`,
    phone: `98711${suffix.slice(0, 5)}`,
    status: 'ACTIVE',
  });

  const stayA = await stayRepo.createForOrganization(orgA.id, {
    residentId: residentA.id,
    admissionDate: new Date('2026-08-01'),
    status: 'ACTIVE',
  });

  const invoiceA = await billingRepo.createInvoice({
    organization_id: orgA.id,
    resident_id: residentA.id,
    stay_id: stayA.id,
    invoice_number: `INV-TASK-${suffix}`,
    billing_period_start: '2026-08-01',
    billing_period_end: '2026-08-31',
    due_date: '2026-08-05',
    subtotal_amount: 8000,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 8000,
    paid_amount: 0,
    balance_due_amount: 8000,
    status: 'OVERDUE',
  });

  const messA = await messRepo.createMess({
    organization_id: orgA.id,
    name: `Mess Task ${suffix}`,
    code: `MESS-TASK-${suffix}`,
    scope_type: 'CENTRAL',
    is_active: true,
  });

  const itemA = await messInvRepo.createInventoryItem({
    organization_id: orgA.id,
    mess_id: messA.id,
    name: `Rice ${suffix}`,
    category: 'GRAINS',
    current_stock: 2,
    minimum_stock: 10,
    reorder_level: 15,
    unit: 'kg',
    status: 'IN_STOCK',
  });

  const notifA = await notifRepo.create(orgA.id, {
    type: 'OUTSTANDING_DUES',
    severity: 'WARNING',
    title: 'Outstanding Dues Alert',
    message: `${residentA.first_name} has outstanding dues of ₹8,000`,
    entity_type: 'RESIDENT',
    entity_id: residentA.id,
    action_route: `/(owner)/residents/${residentA.id}`,
    metadata: { residentId: residentA.id },
    dedupe_key: `DUES:${residentA.id}:${suffix}`,
    status: 'UNREAD',
    read_at: null,
    resolved_at: null,
    expires_at: null,
  });

  console.log('✅ Operational Context Scaffolded (Resident, Invoice, Inventory Item, Notification)');

  // --- SECTION 1: BASIC CRUD & PERSISTENCE ---
  console.log('\n--- 1. BASIC CRUD & PERSISTENCE ---');
  const taskCreated = await taskRepo.createForOrganization(orgA.id, {
    title: `Collect Dues from ${residentA.first_name}`,
    description: `Invoice ${invoiceA.invoice_number} is overdue with balance ₹8,000`,
    status: 'TODO',
    priority: 'HIGH',
    due_date: new Date('2026-08-20'),
    completed_at: null,
    cancelled_at: null,
    assigned_to_user_id: userA.id,
    created_by_user_id: userA.id,
    resident_id: residentA.id,
    invoice_id: invoiceA.id,
    payment_id: null,
    inventory_item_id: null,
    procurement_id: null,
    expense_id: null,
    notification_id: notifA.id,
  });

  if (!taskCreated.id) throw new Error('Task creation failed');
  console.log('✅ Tasks table exists & creation persists to PostgreSQL');

  const fetchedTask = await taskRepo.findById(taskCreated.id, orgA.id);
  if (!fetchedTask || fetchedTask.title !== taskCreated.title) {
    throw new Error('Fresh GET for persisted task failed');
  }
  console.log('✅ Fresh GET returns persisted task');

  const assignedTask = await taskRepo.updateForOrganization(taskCreated.id, orgA.id, {
    assigned_to_user_id: userA.id,
  });
  if (!assignedTask || assignedTask.assigned_to_user_id !== userA.id) {
    throw new Error('Task assignment failed');
  }
  console.log('✅ Task assignment persisted');

  // --- SECTION 2: TENANT ISOLATION ---
  console.log('\n--- 2. TENANT ISOLATION ---');
  const crossTenantGet = await taskRepo.findById(taskCreated.id, orgB.id);
  if (crossTenantGet !== null) {
    throw new Error('TENANT ISOLATION VIOLATION: Org B accessed Org A task!');
  }
  console.log('✅ Cross-tenant task GET blocked');

  const crossTenantUpdate = await taskRepo.updateForOrganization(taskCreated.id, orgB.id, {
    title: 'Hacked Title',
  });
  if (crossTenantUpdate !== null) {
    throw new Error('TENANT ISOLATION VIOLATION: Org B updated Org A task!');
  }
  console.log('✅ Cross-tenant task update blocked');

  const orgBList = await taskRepo.list(orgB.id, {});
  if (orgBList.total !== 0 || orgBList.data.length !== 0) {
    throw new Error('TENANT ISOLATION VIOLATION: Org B list returned Org A tasks!');
  }
  console.log('✅ Cross-tenant task list isolated');

  // --- SECTIONS 3-6: TRANSITIONS, DEDUPLICATION, ROLLBACK & INTEGRITY ---
  await runTaskTransitionsAndIntegrityTests(
    db,
    taskRepo,
    unitOfWork,
    orgA.id,
    orgB.id,
    userA.id,
    userB.id,
    residentA.id,
    invoiceA.id,
    itemA.id,
    notifA.id,
    suffix
  );

  console.log('\n🎉 TASK & FOLLOW-UP MANAGEMENT E2E VERIFICATION PASSED 100%!');
}

runTaskE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E Failed:', err);
    process.exit(1);
  });
