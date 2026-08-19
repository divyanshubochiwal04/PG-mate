import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Mess Configurations Table
  await db.schema
    .createTable('mess_configurations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('restrict')
    )
    .addColumn('is_enabled', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('scope_type', 'varchar(20)', (col) => col.notNull().defaultTo('CENTRAL'))
    .addColumn('billing_mode', 'varchar(20)', (col) => col.notNull().defaultTo('MONTHLY'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_mess_config_org', ['organization_id'])
    .addCheckConstraint('check_mess_config_scope', sql`scope_type IN ('CENTRAL', 'PER_BLOCK')`)
    .addCheckConstraint(
      'check_mess_config_billing',
      sql`billing_mode IN ('PER_MEAL', 'MONTHLY', 'HYBRID')`
    )
    .execute();

  // 2. Messes (Mess Facilities) Table
  await db.schema
    .createTable('messes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('restrict')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('code', 'varchar(50)', (col) => col.notNull())
    .addColumn('scope_type', 'varchar(20)', (col) => col.notNull().defaultTo('CENTRAL'))
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_messes_id_org', ['id', 'organization_id'])
    .addUniqueConstraint('uq_messes_org_code', ['organization_id', 'code'])
    .addCheckConstraint('check_messes_scope', sql`scope_type IN ('CENTRAL', 'PER_BLOCK')`)
    .execute();

  // 3. Mess Building Assignments (Per Block Scope Mapping)
  await db.schema
    .createTable('mess_building_assignments')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('building_id', 'uuid', (col) => col.notNull())
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addForeignKeyConstraint(
      'fk_mess_bld_mess_org',
      ['mess_id', 'organization_id'],
      'messes',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_mess_bld_bld_org',
      ['building_id', 'organization_id'],
      'buildings',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .execute();

  // 4. Mess Meal Types Table (Breakfast, Lunch, Snacks, Dinner)
  await db.schema
    .createTable('mess_meal_types')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('name', 'varchar(50)', (col) => col.notNull())
    .addColumn('start_time', 'varchar(10)', (col) => col.notNull())
    .addColumn('end_time', 'varchar(10)', (col) => col.notNull())
    .addColumn('display_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_meal_types_id_org', ['id', 'organization_id'])
    .addForeignKeyConstraint(
      'fk_meal_types_mess_org',
      ['mess_id', 'organization_id'],
      'messes',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .execute();

  // 5. Mess Meal Plans Table
  await db.schema
    .createTable('mess_meal_plans')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'varchar(500)')
    .addColumn('billing_mode', 'varchar(20)', (col) => col.notNull())
    .addColumn('price', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('included_meal_types', 'text', (col) => col.notNull().defaultTo('ALL'))
    .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_meal_plans_id_org', ['id', 'organization_id'])
    .addForeignKeyConstraint(
      'fk_meal_plans_mess_org',
      ['mess_id', 'organization_id'],
      'messes',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addCheckConstraint('check_meal_plans_price', sql`price >= 0`)
    .addCheckConstraint('check_meal_plans_mode', sql`billing_mode IN ('PER_MEAL', 'MONTHLY')`)
    .execute();

  // 6. Mess Menus & Menu Items
  await db.schema
    .createTable('mess_menus')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('menu_date', 'date', (col) => col.notNull())
    .addColumn('meal_type_id', 'uuid', (col) => col.notNull())
    .addColumn('notes', 'varchar(500)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_mess_menus_id_org', ['id', 'organization_id'])
    .addForeignKeyConstraint(
      'fk_menus_mess_org',
      ['mess_id', 'organization_id'],
      'messes',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_menus_meal_type_org',
      ['meal_type_id', 'organization_id'],
      'mess_meal_types',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .execute();

  await db.schema
    .createTable('mess_menu_items')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('menu_id', 'uuid', (col) =>
      col.notNull().references('mess_menus.id').onDelete('cascade')
    )
    .addColumn('item_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('category', 'varchar(50)', (col) => col.notNull().defaultTo('MAIN_COURSE'))
    .addColumn('display_order', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  // 7. Resident Mess Subscriptions (Stay-Scoped)
  await db.schema
    .createTable('resident_mess_subscriptions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('resident_id', 'uuid', (col) => col.notNull())
    .addColumn('stay_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('meal_plan_id', 'uuid', (col) => col.notNull())
    .addColumn('billing_mode', 'varchar(20)', (col) => col.notNull())
    .addColumn('price_at_subscription', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('start_date', 'date', (col) => col.notNull().defaultTo(sql`CURRENT_DATE`))
    .addColumn('end_date', 'date')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_mess_subs_id_org', ['id', 'organization_id'])
    .addForeignKeyConstraint(
      'fk_subs_resident_org',
      ['resident_id', 'organization_id'],
      'residents',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_subs_stay_org',
      ['stay_id', 'organization_id'],
      'stays',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_subs_mess_org',
      ['mess_id', 'organization_id'],
      'messes',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addForeignKeyConstraint(
      'fk_subs_plan_org',
      ['meal_plan_id', 'organization_id'],
      'mess_meal_plans',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addCheckConstraint('check_subs_price', sql`price_at_subscription >= 0`)
    .addCheckConstraint('check_subs_mode', sql`billing_mode IN ('PER_MEAL', 'MONTHLY')`)
    .addCheckConstraint(
      'check_subs_status',
      sql`status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED', 'SUPERSEDED')`
    )
    .execute();

  // 8. Mess Meal Consumptions (Idempotent Attendance)
  await db.schema
    .createTable('mess_meal_consumptions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('subscription_id', 'uuid', (col) => col.notNull())
    .addColumn('resident_id', 'uuid', (col) => col.notNull())
    .addColumn('stay_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('meal_type_id', 'uuid', (col) => col.notNull())
    .addColumn('consumption_date', 'date', (col) => col.notNull().defaultTo(sql`CURRENT_DATE`))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('CONSUMED'))
    .addColumn('notes', 'varchar(255)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addForeignKeyConstraint(
      'fk_cons_sub_org',
      ['subscription_id', 'organization_id'],
      'resident_mess_subscriptions',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_cons_resident_org',
      ['resident_id', 'organization_id'],
      'residents',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_cons_mess_org',
      ['mess_id', 'organization_id'],
      'messes',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addForeignKeyConstraint(
      'fk_cons_meal_type_org',
      ['meal_type_id', 'organization_id'],
      'mess_meal_types',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addCheckConstraint('check_cons_status', sql`status IN ('CONSUMED', 'SKIPPED', 'CANCELLED')`)
    .execute();

  // 9. Mess Kitchen Inventory Items
  await db.schema
    .createTable('mess_inventory_items')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('category', 'varchar(50)', (col) => col.notNull())
    .addColumn('unit', 'varchar(20)', (col) => col.notNull())
    .addColumn('current_stock', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(sql`0.00`))
    .addColumn('minimum_stock', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(sql`0.00`))
    .addColumn('reorder_level', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(sql`0.00`))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('IN_STOCK'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_inv_items_id_org', ['id', 'organization_id'])
    .addForeignKeyConstraint(
      'fk_inv_mess_org',
      ['mess_id', 'organization_id'],
      'messes',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addCheckConstraint('check_inv_current_stock', sql`current_stock >= 0`)
    .addCheckConstraint('check_inv_minimum_stock', sql`minimum_stock >= 0`)
    .addCheckConstraint('check_inv_reorder_level', sql`reorder_level >= 0`)
    .addCheckConstraint(
      'check_inv_status',
      sql`status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')`
    )
    .execute();

  // 10. Mess Inventory Transaction Ledger
  await db.schema
    .createTable('mess_inventory_transactions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('inventory_item_id', 'uuid', (col) => col.notNull())
    .addColumn('transaction_type', 'varchar(30)', (col) => col.notNull())
    .addColumn('quantity', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('stock_before', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('stock_after', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('unit', 'varchar(20)', (col) => col.notNull())
    .addColumn('procurement_id', 'uuid')
    .addColumn('notes', 'varchar(500)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addForeignKeyConstraint(
      'fk_inv_tx_item_org',
      ['inventory_item_id', 'organization_id'],
      'mess_inventory_items',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addCheckConstraint('check_inv_tx_quantity', sql`quantity > 0`)
    .addCheckConstraint('check_inv_tx_stock_before', sql`stock_before >= 0`)
    .addCheckConstraint('check_inv_tx_stock_after', sql`stock_after >= 0`)
    .addCheckConstraint(
      'check_inv_tx_type',
      sql`transaction_type IN ('OPENING_STOCK', 'PURCHASE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'CONSUMPTION', 'WASTAGE')`
    )
    .execute();

  // 11. Mess Vendors Table
  await db.schema
    .createTable('mess_vendors')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('restrict')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('phone', 'varchar(20)')
    .addColumn('email', 'varchar(255)')
    .addColumn('address', 'varchar(500)')
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('notes', 'varchar(500)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_vendors_id_org', ['id', 'organization_id'])
    .addCheckConstraint('check_vendors_status', sql`status IN ('ACTIVE', 'INACTIVE')`)
    .execute();

  // 12. Mess Procurements & Line Items
  await db.schema
    .createTable('mess_procurements')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('vendor_id', 'uuid', (col) => col.notNull())
    .addColumn('purchase_date', 'date', (col) => col.notNull().defaultTo(sql`CURRENT_DATE`))
    .addColumn('invoice_reference', 'varchar(100)')
    .addColumn('total_amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('notes', 'varchar(500)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('uq_procurements_id_org', ['id', 'organization_id'])
    .addForeignKeyConstraint(
      'fk_proc_mess_org',
      ['mess_id', 'organization_id'],
      'messes',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addForeignKeyConstraint(
      'fk_proc_vendor_org',
      ['vendor_id', 'organization_id'],
      'mess_vendors',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addCheckConstraint('check_proc_total_amount', sql`total_amount >= 0`)
    .execute();

  await db.schema
    .createTable('mess_procurement_items')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('procurement_id', 'uuid', (col) =>
      col.notNull().references('mess_procurements.id').onDelete('cascade')
    )
    .addColumn('inventory_item_id', 'uuid', (col) => col.notNull())
    .addColumn('quantity', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('unit_price', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('total_price', sql`numeric(12,2)`, (col) => col.notNull())
    .addCheckConstraint('check_proc_item_quantity', sql`quantity > 0`)
    .addCheckConstraint('check_proc_item_unit_price', sql`unit_price >= 0`)
    .addCheckConstraint('check_proc_item_total_price', sql`total_price >= 0`)
    .execute();

  // 13. Mess Expenses Table
  await db.schema
    .createTable('mess_expenses')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('mess_id', 'uuid', (col) => col.notNull())
    .addColumn('category', 'varchar(50)', (col) => col.notNull())
    .addColumn('amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('expense_date', 'date', (col) => col.notNull().defaultTo(sql`CURRENT_DATE`))
    .addColumn('vendor_id', 'uuid')
    .addColumn('reference_no', 'varchar(100)')
    .addColumn('notes', 'varchar(500)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addForeignKeyConstraint(
      'fk_exp_mess_org',
      ['mess_id', 'organization_id'],
      'messes',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addCheckConstraint('check_expenses_amount', sql`amount > 0`)
    .addCheckConstraint(
      'check_expenses_category',
      sql`category IN ('GAS', 'ELECTRICITY', 'SALARY', 'CLEANING', 'TRANSPORT', 'MAINTENANCE', 'MISCELLANEOUS')`
    )
    .execute();

  // 14. Partial Unique Indexes & Custom Business Rules
  await sql`
    CREATE UNIQUE INDEX idx_uq_active_building_mess 
    ON mess_building_assignments (organization_id, building_id) 
    WHERE is_active = true
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX idx_uq_active_mess_sub 
    ON resident_mess_subscriptions (stay_id) 
    WHERE status = 'ACTIVE'
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX idx_uq_meal_consumption_idempotent 
    ON mess_meal_consumptions (subscription_id, consumption_date, meal_type_id)
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX idx_uq_mess_menu_date_meal 
    ON mess_menus (mess_id, menu_date, meal_type_id)
  `.execute(db);

  // 15. Operational Query Optimization Indexes
  await db.schema
    .createIndex('idx_mess_subs_stay_status')
    .on('resident_mess_subscriptions')
    .columns(['organization_id', 'stay_id', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_meal_cons_date_mess')
    .on('mess_meal_consumptions')
    .columns(['organization_id', 'mess_id', 'consumption_date'])
    .execute();

  await db.schema
    .createIndex('idx_inv_items_mess_status')
    .on('mess_inventory_items')
    .columns(['organization_id', 'mess_id', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_expenses_mess_date')
    .on('mess_expenses')
    .columns(['organization_id', 'mess_id', 'expense_date'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('mess_expenses').ifExists().execute();
  await db.schema.dropTable('mess_procurement_items').ifExists().execute();
  await db.schema.dropTable('mess_procurements').ifExists().execute();
  await db.schema.dropTable('mess_vendors').ifExists().execute();
  await db.schema.dropTable('mess_inventory_transactions').ifExists().execute();
  await db.schema.dropTable('mess_inventory_items').ifExists().execute();
  await db.schema.dropTable('mess_meal_consumptions').ifExists().execute();
  await db.schema.dropTable('resident_mess_subscriptions').ifExists().execute();
  await db.schema.dropTable('mess_menu_items').ifExists().execute();
  await db.schema.dropTable('mess_menus').ifExists().execute();
  await db.schema.dropTable('mess_meal_plans').ifExists().execute();
  await db.schema.dropTable('mess_meal_types').ifExists().execute();
  await db.schema.dropTable('mess_building_assignments').ifExists().execute();
  await db.schema.dropTable('messes').ifExists().execute();
  await db.schema.dropTable('mess_configurations').ifExists().execute();
}
