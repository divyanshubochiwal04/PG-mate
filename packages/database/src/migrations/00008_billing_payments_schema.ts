import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. BILLING CONFIGURATIONS
  await db.schema
    .createTable('billing_configurations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().unique().references('organizations.id').onDelete('cascade')
    )
    .addColumn('grace_period_days', 'integer', (col) => col.notNull().defaultTo(5))
    .addColumn('late_fee_per_day', sql`numeric(12,2)`, (col) =>
      col.notNull().defaultTo(sql`100.00`)
    )
    .addColumn('default_billing_cycle', 'varchar(30)', (col) =>
      col.notNull().defaultTo('JOINING_DATE')
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  // 2. INVOICES
  await db.schema
    .createTable('invoices')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('resident_id', 'uuid', (col) =>
      col.notNull().references('residents.id').onDelete('cascade')
    )
    .addColumn('stay_id', 'uuid', (col) => col.notNull().references('stays.id').onDelete('cascade'))
    .addColumn('invoice_number', 'varchar(50)', (col) => col.notNull())
    .addColumn('billing_period_start', 'date', (col) => col.notNull())
    .addColumn('billing_period_end', 'date', (col) => col.notNull())
    .addColumn('due_date', 'date', (col) => col.notNull())
    .addColumn('subtotal_amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('discount_amount', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(sql`0.00`))
    .addColumn('tax_amount', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(sql`0.00`))
    .addColumn('total_amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('paid_amount', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(sql`0.00`))
    .addColumn('balance_due_amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('status', 'varchar(30)', (col) => col.notNull().defaultTo('ISSUED'))
    .addColumn('issued_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('cancelled_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addCheckConstraint(
      'check_invoice_status',
      sql`status IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')`
    )
    .addCheckConstraint(
      'check_invoice_amounts',
      sql`total_amount >= 0 AND paid_amount >= 0 AND balance_due_amount >= 0`
    )
    .execute();

  await db.schema
    .createIndex('idx_uq_invoice_number')
    .on('invoices')
    .columns(['organization_id', 'invoice_number'])
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_invoices_stay')
    .on('invoices')
    .columns(['organization_id', 'stay_id', 'status'])
    .execute();

  // 3. INVOICE ITEMS
  await db.schema
    .createTable('invoice_items')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('invoice_id', 'uuid', (col) =>
      col.notNull().references('invoices.id').onDelete('cascade')
    )
    .addColumn('charge_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('description', 'varchar(255)', (col) => col.notNull())
    .addColumn('unit_amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('quantity', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(sql`1.00`))
    .addColumn('total_amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addCheckConstraint(
      'check_invoice_item_charge_type',
      sql`charge_type IN ('BASE_RENT', 'FACILITY', 'MESS', 'ADDITIONAL_CHARGE', 'LATE_FEE', 'DISCOUNT', 'ADJUSTMENT')`
    )
    .execute();

  await db.schema
    .createIndex('idx_invoice_items_invoice')
    .on('invoice_items')
    .columns(['organization_id', 'invoice_id'])
    .execute();

  // 4. PAYMENTS
  await db.schema
    .createTable('payments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('resident_id', 'uuid', (col) =>
      col.notNull().references('residents.id').onDelete('cascade')
    )
    .addColumn('stay_id', 'uuid', (col) => col.notNull().references('stays.id').onDelete('cascade'))
    .addColumn('payment_number', 'varchar(50)', (col) => col.notNull())
    .addColumn('amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('payment_method', 'varchar(30)', (col) => col.notNull())
    .addColumn('reference_number', 'varchar(100)')
    .addColumn('payment_date', 'date', (col) => col.notNull())
    .addColumn('status', 'varchar(30)', (col) => col.notNull().defaultTo('COMPLETED'))
    .addColumn('idempotency_key', 'varchar(100)', (col) => col.notNull())
    .addColumn('received_by_user_id', 'uuid')
    .addColumn('notes', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addCheckConstraint(
      'check_payment_method',
      sql`payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER')`
    )
    .addCheckConstraint('check_payment_status', sql`status IN ('COMPLETED', 'REVERSED')`)
    .addCheckConstraint('check_payment_amount_pos', sql`amount > 0`)
    .execute();

  await db.schema
    .createIndex('idx_uq_payment_idempotency')
    .on('payments')
    .columns(['organization_id', 'idempotency_key'])
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_payments_stay')
    .on('payments')
    .columns(['organization_id', 'stay_id'])
    .execute();

  // 5. PAYMENT ALLOCATIONS
  await db.schema
    .createTable('payment_allocations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('payment_id', 'uuid', (col) =>
      col.notNull().references('payments.id').onDelete('cascade')
    )
    .addColumn('invoice_id', 'uuid', (col) =>
      col.notNull().references('invoices.id').onDelete('cascade')
    )
    .addColumn('amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('allocated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addCheckConstraint('check_allocation_amount_pos', sql`amount > 0`)
    .execute();

  // 6. RECEIPTS
  await db.schema
    .createTable('receipts')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('payment_id', 'uuid', (col) =>
      col.notNull().unique().references('payments.id').onDelete('cascade')
    )
    .addColumn('receipt_number', 'varchar(50)', (col) => col.notNull())
    .addColumn('resident_id', 'uuid', (col) =>
      col.notNull().references('residents.id').onDelete('cascade')
    )
    .addColumn('stay_id', 'uuid', (col) => col.notNull().references('stays.id').onDelete('cascade'))
    .addColumn('amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('payment_method', 'varchar(30)', (col) => col.notNull())
    .addColumn('generated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await db.schema
    .createIndex('idx_uq_receipt_number')
    .on('receipts')
    .columns(['organization_id', 'receipt_number'])
    .unique()
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('receipts').ifExists().execute();
  await db.schema.dropTable('payment_allocations').ifExists().execute();
  await db.schema.dropTable('payments').ifExists().execute();
  await db.schema.dropTable('invoice_items').ifExists().execute();
  await db.schema.dropTable('invoices').ifExists().execute();
  await db.schema.dropTable('billing_configurations').ifExists().execute();
}
