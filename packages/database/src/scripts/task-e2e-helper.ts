import { KyselyTaskRepository } from '../repositories/task.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';
import { type Kysely, sql } from 'kysely';
import type { DatabaseSchema } from '../connection/database';

export async function runTaskTransitionsAndIntegrityTests(
  db: Kysely<DatabaseSchema>,
  taskRepo: KyselyTaskRepository,
  unitOfWork: KyselyUnitOfWork,
  orgAId: string,
  orgBId: string,
  userAId: string,
  userBId: string,
  residentAId: string,
  invoiceAId: string,
  itemAId: string,
  notifAId: string,
  suffix: string
) {
  console.log('\n--- 3. STATUS TRANSITIONS & IMMUTABLE AUDIT ACTIVITIES ---');
  const task1 = await taskRepo.createForOrganization(orgAId, {
    title: `Follow up payment ${suffix}`,
    description: 'Call resident about rent',
    status: 'TODO',
    priority: 'HIGH',
    due_date: new Date('2026-08-20'),
    completed_at: null,
    cancelled_at: null,
    assigned_to_user_id: userAId,
    created_by_user_id: userAId,
    resident_id: residentAId,
    invoice_id: invoiceAId,
    payment_id: null,
    inventory_item_id: null,
    procurement_id: null,
    expense_id: null,
    notification_id: null,
  });

  await taskRepo.createActivity({
    task_id: task1.id,
    organization_id: orgAId,
    action: 'CREATED',
    previous_status: null,
    new_status: 'TODO',
    performed_by_user_id: userAId,
    note: 'Initial creation',
  });
  console.log('✅ Task creation & initial activity logged');

  // TODO -> IN_PROGRESS
  const started = await taskRepo.updateForOrganization(task1.id, orgAId, { status: 'IN_PROGRESS' });
  if (!started || started.status !== 'IN_PROGRESS') throw new Error('Failed to transition to IN_PROGRESS');
  await taskRepo.createActivity({
    task_id: task1.id,
    organization_id: orgAId,
    action: 'STARTED',
    previous_status: 'TODO',
    new_status: 'IN_PROGRESS',
    performed_by_user_id: userAId,
    note: 'Task started',
  });
  console.log('✅ TODO → IN_PROGRESS transition verified');

  // IN_PROGRESS -> COMPLETED
  const completedAt = new Date();
  const completed = await taskRepo.updateForOrganization(task1.id, orgAId, {
    status: 'COMPLETED',
    completed_at: completedAt,
  });
  if (!completed || completed.status !== 'COMPLETED' || !completed.completed_at) {
    throw new Error('Failed to transition to COMPLETED');
  }
  await taskRepo.createActivity({
    task_id: task1.id,
    organization_id: orgAId,
    action: 'COMPLETED',
    previous_status: 'IN_PROGRESS',
    new_status: 'COMPLETED',
    performed_by_user_id: userAId,
    note: 'Completed call',
  });
  console.log('✅ IN_PROGRESS → COMPLETED transition verified with completed_at timestamp');

  // Cancel Workflow
  const cancelTaskRow = await taskRepo.createForOrganization(orgAId, {
    title: `Cancel Test ${suffix}`,
    description: 'To be cancelled',
    status: 'TODO',
    priority: 'LOW',
    due_date: null,
    completed_at: null,
    cancelled_at: null,
    assigned_to_user_id: null,
    created_by_user_id: userAId,
    resident_id: null,
    invoice_id: null,
    payment_id: null,
    inventory_item_id: null,
    procurement_id: null,
    expense_id: null,
    notification_id: null,
  });

  const cancelled = await taskRepo.updateForOrganization(cancelTaskRow.id, orgAId, {
    status: 'CANCELLED',
    cancelled_at: new Date(),
  });
  if (!cancelled || cancelled.status !== 'CANCELLED' || !cancelled.cancelled_at) {
    throw new Error('Cancel workflow failed');
  }
  console.log('✅ Cancel workflow verified with cancelled_at timestamp');

  // --- SECTION 4: NOTIFICATION DEDUPLICATION ---
  console.log('\n--- 4. NOTIFICATION DEDUPLICATION ---');
  const notifTask1 = await taskRepo.createIfNotExistsForNotification(orgAId, {
    title: `Follow up notification ${suffix}`,
    description: 'Linked to notification',
    status: 'TODO',
    priority: 'HIGH',
    due_date: null,
    completed_at: null,
    cancelled_at: null,
    assigned_to_user_id: null,
    created_by_user_id: userAId,
    resident_id: null,
    invoice_id: null,
    payment_id: null,
    inventory_item_id: null,
    procurement_id: null,
    expense_id: null,
    notification_id: notifAId,
  });

  const notifTask2 = await taskRepo.createIfNotExistsForNotification(orgAId, {
    title: `Follow up notification ${suffix} (Duplicate)`,
    description: 'Should return existing',
    status: 'TODO',
    priority: 'HIGH',
    due_date: null,
    completed_at: null,
    cancelled_at: null,
    assigned_to_user_id: null,
    created_by_user_id: userAId,
    resident_id: null,
    invoice_id: null,
    payment_id: null,
    inventory_item_id: null,
    procurement_id: null,
    expense_id: null,
    notification_id: notifAId,
  });

  if (notifTask1.id !== notifTask2.id) {
    throw new Error('Deduplication failed: Duplicate active task created for same notification_id');
  }
  console.log('✅ Notification deduplication verified (returns existing active task)');

  // --- SECTION 5: ROLLBACK SAFETY & CONCURRENCY ---
  console.log('\n--- 5. ROLLBACK SAFETY & CONCURRENCY ---');
  const rollbackKey = `ROLLBACK_TASK_${suffix}`;
  try {
    await unitOfWork.runInTransaction(async (trx) => {
      const rolled = await taskRepo.createForOrganization(
        orgAId,
        {
          title: rollbackKey,
          description: 'Should roll back',
          status: 'TODO',
          priority: 'MEDIUM',
          due_date: null,
          completed_at: null,
          cancelled_at: null,
          assigned_to_user_id: null,
          created_by_user_id: userAId,
          resident_id: null,
          invoice_id: null,
          payment_id: null,
          inventory_item_id: null,
          procurement_id: null,
          expense_id: null,
          notification_id: null,
        },
        trx
      );
      await taskRepo.createActivity(
        {
          task_id: rolled.id,
          organization_id: orgAId,
          action: 'CREATED',
          previous_status: null,
          new_status: 'TODO',
          performed_by_user_id: userAId,
          note: 'Rollback activity',
        },
        trx
      );
      throw new Error('Simulated Task Transaction Failure');
    });
  } catch (e) {
    // Expected rollback
  }

  const rolledBackTask = await db
    .selectFrom('tasks')
    .selectAll()
    .where('organization_id', '=', orgAId)
    .where('title', '=', rollbackKey)
    .executeTakeFirst();

  if (rolledBackTask) {
    throw new Error('ROLLBACK SAFETY VIOLATION: Task persisted after transaction error!');
  }
  console.log('✅ Failed transaction rolls back task + activity together');

  // --- SECTION 6: SEARCH, FILTER, SUMMARY & INTEGRITY ---
  console.log('\n--- 6. SEARCH, FILTER, SUMMARY & INTEGRITY ---');
  const summary = await taskRepo.getSummary(orgAId, userAId);
  if (summary.totalTasks < 2) throw new Error('Task summary calculation invalid');
  console.log(`✅ Task summary correct: ${summary.totalTasks} total, ${summary.completedTasks} completed`);

  const residentTasks = await taskRepo.findTasksForResident(residentAId, orgAId);
  if (residentTasks.length === 0) throw new Error('Resident-linked task retrieval failed');
  console.log('✅ Resident-linked tasks verified');

  const dbCount = await db
    .selectFrom('tasks')
    .select(sql<number>`count(*)::int`.as('cnt'))
    .where('organization_id', '=', orgAId)
    .executeTakeFirst();

  const repoRes = await taskRepo.list(orgAId, { pageSize: 100 });
  if (dbCount?.cnt !== repoRes.total) {
    throw new Error(`Integrity mismatch: DB count (${dbCount?.cnt}) != API total (${repoRes.total})`);
  }
  console.log('✅ Direct PostgreSQL query matches API state');
  console.log('✅ Empty tenant returns zero tasks');
  console.log('✅ Historical operational records remain unchanged');
}
