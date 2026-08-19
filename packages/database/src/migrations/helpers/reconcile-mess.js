"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileMessSchema = reconcileMessSchema;
const kysely_1 = require("kysely");
async function reconcileMessSchema(db) {
    // 1. Mess Configurations Table
    await db.schema
        .createTable('mess_configurations')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull().references('organizations.id').onDelete('restrict'))
        .addColumn('is_enabled', 'boolean', (col) => col.notNull().defaultTo(true))
        .addColumn('scope_type', 'varchar(20)', (col) => col.notNull().defaultTo('CENTRAL'))
        .addColumn('billing_mode', 'varchar(20)', (col) => col.notNull().defaultTo('MONTHLY'))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addUniqueConstraint('uq_mess_config_org', ['organization_id'])
        .addCheckConstraint('check_mess_config_scope', (0, kysely_1.sql) `scope_type IN ('CENTRAL', 'PER_BLOCK')`)
        .addCheckConstraint('check_mess_config_billing', (0, kysely_1.sql) `billing_mode IN ('PER_MEAL', 'MONTHLY', 'HYBRID')`)
        .execute();
    // 2. Messes Table
    await db.schema
        .createTable('messes')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull().references('organizations.id').onDelete('restrict'))
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .addColumn('code', 'varchar(50)', (col) => col.notNull())
        .addColumn('scope_type', 'varchar(20)', (col) => col.notNull().defaultTo('CENTRAL'))
        .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addUniqueConstraint('uq_messes_id_org', ['id', 'organization_id'])
        .addUniqueConstraint('uq_messes_org_code', ['organization_id', 'code'])
        .addCheckConstraint('check_messes_scope', (0, kysely_1.sql) `scope_type IN ('CENTRAL', 'PER_BLOCK')`)
        .execute();
    // 3. Mess Building Assignments Table
    await db.schema
        .createTable('mess_building_assignments')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('building_id', 'uuid', (col) => col.notNull())
        .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addForeignKeyConstraint('fk_mess_bld_mess_org', ['mess_id', 'organization_id'], 'messes', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addForeignKeyConstraint('fk_mess_bld_bld_org', ['building_id', 'organization_id'], 'buildings', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .execute();
    // 4. Mess Meal Types Table
    await db.schema
        .createTable('mess_meal_types')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('name', 'varchar(50)', (col) => col.notNull())
        .addColumn('start_time', 'varchar(10)', (col) => col.notNull())
        .addColumn('end_time', 'varchar(10)', (col) => col.notNull())
        .addColumn('display_order', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addUniqueConstraint('uq_meal_types_id_org', ['id', 'organization_id'])
        .addForeignKeyConstraint('fk_meal_types_mess_org', ['mess_id', 'organization_id'], 'messes', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .execute();
    // 5. Mess Meal Plans Table
    await db.schema
        .createTable('mess_meal_plans')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .addColumn('description', 'varchar(500)')
        .addColumn('billing_mode', 'varchar(20)', (col) => col.notNull())
        .addColumn('price', (0, kysely_1.sql) `numeric(12,2)`, (col) => col.notNull())
        .addColumn('included_meal_types', 'text', (col) => col.notNull().defaultTo('ALL'))
        .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
        .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addUniqueConstraint('uq_meal_plans_id_org', ['id', 'organization_id'])
        .addForeignKeyConstraint('fk_meal_plans_mess_org', ['mess_id', 'organization_id'], 'messes', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addCheckConstraint('check_meal_plans_price', (0, kysely_1.sql) `price >= 0`)
        .addCheckConstraint('check_meal_plans_mode', (0, kysely_1.sql) `billing_mode IN ('PER_MEAL', 'MONTHLY')`)
        .execute();
    // 6. Mess Menus & Menu Items
    await db.schema
        .createTable('mess_menus')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('menu_date', 'date', (col) => col.notNull())
        .addColumn('meal_type_id', 'uuid', (col) => col.notNull())
        .addColumn('notes', 'varchar(500)')
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addUniqueConstraint('uq_mess_menus_id_org', ['id', 'organization_id'])
        .addForeignKeyConstraint('fk_menus_mess_org', ['mess_id', 'organization_id'], 'messes', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addForeignKeyConstraint('fk_menus_meal_type_org', ['meal_type_id', 'organization_id'], 'mess_meal_types', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .execute();
    await db.schema
        .createTable('mess_menu_items')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('menu_id', 'uuid', (col) => col.notNull().references('mess_menus.id').onDelete('cascade'))
        .addColumn('item_name', 'varchar(255)', (col) => col.notNull())
        .addColumn('category', 'varchar(50)', (col) => col.notNull().defaultTo('MAIN_COURSE'))
        .addColumn('display_order', 'integer', (col) => col.notNull().defaultTo(0))
        .execute();
    // 7. Resident Mess Subscriptions Table
    await db.schema
        .createTable('resident_mess_subscriptions')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('resident_id', 'uuid', (col) => col.notNull())
        .addColumn('stay_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('meal_plan_id', 'uuid', (col) => col.notNull())
        .addColumn('billing_mode', 'varchar(20)', (col) => col.notNull())
        .addColumn('price_at_subscription', (0, kysely_1.sql) `numeric(12,2)`, (col) => col.notNull())
        .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
        .addColumn('start_date', 'date', (col) => col.notNull().defaultTo((0, kysely_1.sql) `CURRENT_DATE`))
        .addColumn('end_date', 'date')
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addUniqueConstraint('uq_mess_subs_id_org', ['id', 'organization_id'])
        .addForeignKeyConstraint('fk_subs_resident_org', ['resident_id', 'organization_id'], 'residents', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addForeignKeyConstraint('fk_subs_stay_org', ['stay_id', 'organization_id'], 'stays', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addForeignKeyConstraint('fk_subs_mess_org', ['mess_id', 'organization_id'], 'messes', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addForeignKeyConstraint('fk_subs_plan_org', ['meal_plan_id', 'organization_id'], 'mess_meal_plans', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addCheckConstraint('check_subs_price', (0, kysely_1.sql) `price_at_subscription >= 0`)
        .addCheckConstraint('check_subs_mode', (0, kysely_1.sql) `billing_mode IN ('PER_MEAL', 'MONTHLY')`)
        .addCheckConstraint('check_subs_status', (0, kysely_1.sql) `status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED', 'SUPERSEDED')`)
        .execute();
    // 8. Mess Meal Consumptions Table
    await db.schema
        .createTable('mess_meal_consumptions')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('subscription_id', 'uuid', (col) => col.notNull())
        .addColumn('resident_id', 'uuid', (col) => col.notNull())
        .addColumn('stay_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('meal_type_id', 'uuid', (col) => col.notNull())
        .addColumn('consumption_date', 'date', (col) => col.notNull().defaultTo((0, kysely_1.sql) `CURRENT_DATE`))
        .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('CONSUMED'))
        .addColumn('notes', 'varchar(255)')
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addForeignKeyConstraint('fk_cons_sub_org', ['subscription_id', 'organization_id'], 'resident_mess_subscriptions', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addForeignKeyConstraint('fk_cons_resident_org', ['resident_id', 'organization_id'], 'residents', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addForeignKeyConstraint('fk_cons_mess_org', ['mess_id', 'organization_id'], 'messes', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addForeignKeyConstraint('fk_cons_meal_type_org', ['meal_type_id', 'organization_id'], 'mess_meal_types', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addCheckConstraint('check_cons_status', (0, kysely_1.sql) `status IN ('CONSUMED', 'SKIPPED', 'CANCELLED')`)
        .execute();
    // 9. Mess Inventory Items Table
    await db.schema
        .createTable('mess_inventory_items')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .addColumn('category', 'varchar(50)', (col) => col.notNull().defaultTo('GENERAL'))
        .addColumn('unit', 'varchar(20)', (col) => col.notNull())
        .addColumn('current_stock', (0, kysely_1.sql) `numeric(12,3)`, (col) => col.notNull().defaultTo((0, kysely_1.sql) `0.000`))
        .addColumn('minimum_stock', (0, kysely_1.sql) `numeric(12,3)`, (col) => col.notNull().defaultTo((0, kysely_1.sql) `0.000`))
        .addColumn('reorder_level', (0, kysely_1.sql) `numeric(12,3)`, (col) => col.notNull().defaultTo((0, kysely_1.sql) `0.000`))
        .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('IN_STOCK'))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addUniqueConstraint('uq_mess_inv_items_id_org', ['id', 'organization_id'])
        .addForeignKeyConstraint('fk_inv_items_mess_org', ['mess_id', 'organization_id'], 'messes', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addCheckConstraint('check_inv_stock', (0, kysely_1.sql) `current_stock >= 0`)
        .addCheckConstraint('check_inv_status', (0, kysely_1.sql) `status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')`)
        .execute();
    // 10. Mess Inventory Transactions Table
    await db.schema
        .createTable('mess_inventory_transactions')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('inventory_item_id', 'uuid', (col) => col.notNull())
        .addColumn('transaction_type', 'varchar(30)', (col) => col.notNull())
        .addColumn('quantity', (0, kysely_1.sql) `numeric(12,3)`, (col) => col.notNull())
        .addColumn('stock_before', (0, kysely_1.sql) `numeric(12,3)`, (col) => col.notNull())
        .addColumn('stock_after', (0, kysely_1.sql) `numeric(12,3)`, (col) => col.notNull())
        .addColumn('unit', 'varchar(20)', (col) => col.notNull())
        .addColumn('procurement_id', 'uuid')
        .addColumn('notes', 'varchar(500)')
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addForeignKeyConstraint('fk_inv_trans_item_org', ['inventory_item_id', 'organization_id'], 'mess_inventory_items', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addCheckConstraint('check_inv_trans_type', (0, kysely_1.sql) `transaction_type IN ('OPENING_STOCK', 'PURCHASE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'CONSUMPTION', 'WASTAGE')`)
        .execute();
    // 11. Mess Vendors Table
    await db.schema
        .createTable('mess_vendors')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull().references('organizations.id').onDelete('restrict'))
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .addColumn('phone', 'varchar(20)')
        .addColumn('email', 'varchar(255)')
        .addColumn('address', 'varchar(500)')
        .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
        .addColumn('notes', 'varchar(500)')
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addUniqueConstraint('uq_mess_vendors_id_org', ['id', 'organization_id'])
        .addCheckConstraint('check_vendors_status', (0, kysely_1.sql) `status IN ('ACTIVE', 'INACTIVE')`)
        .execute();
    // 12. Mess Procurements Table
    await db.schema
        .createTable('mess_procurements')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('vendor_id', 'uuid', (col) => col.notNull())
        .addColumn('purchase_date', 'date', (col) => col.notNull().defaultTo((0, kysely_1.sql) `CURRENT_DATE`))
        .addColumn('invoice_reference', 'varchar(100)')
        .addColumn('total_amount', (0, kysely_1.sql) `numeric(12,2)`, (col) => col.notNull())
        .addColumn('notes', 'varchar(500)')
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addUniqueConstraint('uq_procurements_id_org', ['id', 'organization_id'])
        .addForeignKeyConstraint('fk_proc_mess_org', ['mess_id', 'organization_id'], 'messes', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addForeignKeyConstraint('fk_proc_vendor_org', ['vendor_id', 'organization_id'], 'mess_vendors', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addCheckConstraint('check_proc_total', (0, kysely_1.sql) `total_amount >= 0`)
        .execute();
    // 13. Mess Procurement Items Table
    await db.schema
        .createTable('mess_procurement_items')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('procurement_id', 'uuid', (col) => col.notNull().references('mess_procurements.id').onDelete('cascade'))
        .addColumn('inventory_item_id', 'uuid', (col) => col.notNull())
        .addColumn('quantity', (0, kysely_1.sql) `numeric(12,3)`, (col) => col.notNull())
        .addColumn('unit_price', (0, kysely_1.sql) `numeric(12,2)`, (col) => col.notNull())
        .addColumn('total_price', (0, kysely_1.sql) `numeric(12,2)`, (col) => col.notNull())
        .addCheckConstraint('check_proc_item_qty', (0, kysely_1.sql) `quantity > 0`)
        .addCheckConstraint('check_proc_item_price', (0, kysely_1.sql) `unit_price >= 0`)
        .addCheckConstraint('check_proc_item_total', (0, kysely_1.sql) `total_price >= 0`)
        .execute();
    // 14. Mess Expenses Table
    await db.schema
        .createTable('mess_expenses')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('mess_id', 'uuid', (col) => col.notNull())
        .addColumn('category', 'varchar(50)', (col) => col.notNull())
        .addColumn('amount', (0, kysely_1.sql) `numeric(12,2)`, (col) => col.notNull())
        .addColumn('expense_date', 'date', (col) => col.notNull().defaultTo((0, kysely_1.sql) `CURRENT_DATE`))
        .addColumn('vendor_id', 'uuid')
        .addColumn('reference_no', 'varchar(100)')
        .addColumn('notes', 'varchar(500)')
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addForeignKeyConstraint('fk_expenses_mess_org', ['mess_id', 'organization_id'], 'messes', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addCheckConstraint('check_exp_amount', (0, kysely_1.sql) `amount > 0`)
        .addCheckConstraint('check_exp_category', (0, kysely_1.sql) `category IN ('GAS', 'ELECTRICITY', 'SALARY', 'CLEANING', 'TRANSPORT', 'MAINTENANCE', 'MISCELLANEOUS')`)
        .execute();
    // M7.2 Indexes
    await (0, kysely_1.sql) `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_mess_sub_per_stay 
    ON resident_mess_subscriptions (stay_id) 
    WHERE status = 'ACTIVE'
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_meal_consumption 
    ON mess_meal_consumptions (subscription_id, meal_type_id, consumption_date)
  `.execute(db);
    await db.schema
        .createIndex('idx_mess_subs_resident_stay')
        .ifNotExists()
        .on('resident_mess_subscriptions')
        .columns(['organization_id', 'resident_id', 'stay_id', 'status'])
        .execute();
    await db.schema
        .createIndex('idx_mess_consumptions_date')
        .ifNotExists()
        .on('mess_meal_consumptions')
        .columns(['organization_id', 'mess_id', 'consumption_date', 'status'])
        .execute();
    await db.schema
        .createIndex('idx_mess_inventory_status')
        .ifNotExists()
        .on('mess_inventory_items')
        .columns(['organization_id', 'mess_id', 'status'])
        .execute();
    await db.schema
        .createIndex('idx_mess_procurements_date')
        .ifNotExists()
        .on('mess_procurements')
        .columns(['organization_id', 'mess_id', 'purchase_date'])
        .execute();
    await db.schema
        .createIndex('idx_mess_expenses_date')
        .ifNotExists()
        .on('mess_expenses')
        .columns(['organization_id', 'mess_id', 'expense_date', 'category'])
        .execute();
}
//# sourceMappingURL=reconcile-mess.js.map