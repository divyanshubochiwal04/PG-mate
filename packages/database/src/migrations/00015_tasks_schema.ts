import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Create tasks table
  await db.schema
    .createTable('tasks')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull().references('organizations.id').onDelete('cascade'))
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('TODO'))
    .addColumn('priority', 'varchar(50)', (col) => col.notNull().defaultTo('MEDIUM'))
    .addColumn('due_date', 'timestamptz')
    .addColumn('completed_at', 'timestamptz')
    .addColumn('cancelled_at', 'timestamptz')
    .addColumn('assigned_to_user_id', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('created_by_user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('resident_id', 'uuid', (col) => col.references('residents.id').onDelete('set null'))
    .addColumn('invoice_id', 'uuid', (col) => col.references('invoices.id').onDelete('set null'))
    .addColumn('payment_id', 'uuid', (col) => col.references('payments.id').onDelete('set null'))
    .addColumn('inventory_item_id', 'uuid', (col) => col.references('mess_inventory_items.id').onDelete('set null'))
    .addColumn('procurement_id', 'uuid', (col) => col.references('mess_procurements.id').onDelete('set null'))
    .addColumn('expense_id', 'uuid', (col) => col.references('mess_expenses.id').onDelete('set null'))
    .addColumn('notification_id', 'uuid', (col) => col.references('notifications.id').onDelete('set null'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addCheckConstraint('chk_tasks_status', sql`status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`)
    .addCheckConstraint('chk_tasks_priority', sql`priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`)
    .execute();

  // 2. Indexes for tasks
  await db.schema
    .createIndex('idx_tasks_org_status')
    .on('tasks')
    .columns(['organization_id', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_tasks_org_duedate')
    .on('tasks')
    .columns(['organization_id', 'due_date'])
    .execute();

  await db.schema
    .createIndex('idx_tasks_org_assigned_status')
    .on('tasks')
    .columns(['organization_id', 'assigned_to_user_id', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_tasks_org_priority')
    .on('tasks')
    .columns(['organization_id', 'priority'])
    .execute();

  await db.schema
    .createIndex('idx_tasks_org_created')
    .on('tasks')
    .columns(['organization_id', 'created_at'])
    .execute();

  await db.schema
    .createIndex('idx_tasks_org_resident')
    .on('tasks')
    .columns(['organization_id', 'resident_id'])
    .execute();

  await db.schema
    .createIndex('idx_tasks_org_notification')
    .on('tasks')
    .columns(['organization_id', 'notification_id'])
    .execute();

  // Deduplication partial index for notification-linked active tasks
  await sql`
    CREATE UNIQUE INDEX idx_tasks_notification_dedupe 
    ON tasks (organization_id, notification_id) 
    WHERE notification_id IS NOT NULL AND status NOT IN ('CANCELLED');
  `.execute(db);

  // 3. Create task_activities table
  await db.schema
    .createTable('task_activities')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('task_id', 'uuid', (col) => col.notNull().references('tasks.id').onDelete('cascade'))
    .addColumn('organization_id', 'uuid', (col) => col.notNull().references('organizations.id').onDelete('cascade'))
    .addColumn('action', 'varchar(50)', (col) => col.notNull())
    .addColumn('previous_status', 'varchar(50)')
    .addColumn('new_status', 'varchar(50)')
    .addColumn('performed_by_user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('note', 'text')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addCheckConstraint(
      'chk_task_activities_action',
      sql`action IN ('CREATED', 'UPDATED', 'ASSIGNED', 'UNASSIGNED', 'STARTED', 'COMPLETED', 'CANCELLED', 'REOPENED')`
    )
    .execute();

  // 4. Index for task_activities
  await db.schema
    .createIndex('idx_task_activities_task')
    .on('task_activities')
    .columns(['organization_id', 'task_id', 'created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('task_activities').ifExists().execute();
  await db.schema.dropTable('tasks').ifExists().execute();
}
