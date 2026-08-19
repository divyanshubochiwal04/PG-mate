import { dbService } from '../connection/database';
import { sql } from 'kysely';

async function runForensicAudit() {
  const db = dbService.db;
  console.log('==================================================');
  console.log('PHASE 2 — LIVE POSTGRESQL STRUCTURAL AUDIT');
  console.log('==================================================');

  // 1. Audit Column Types & Nullability for M7.1 & M7.2
  console.log('\n--- 1. COLUMN DEFINITIONS (M7.1 & M7.2) ---');
  const colsRes = await sql<{
    table_name: string;
    column_name: string;
    data_type: string;
    numeric_precision: number | null;
    numeric_scale: number | null;
    is_nullable: string;
    column_default: string | null;
  }>`
    SELECT table_name, column_name, data_type, numeric_precision, numeric_scale, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name IN (
        'resident_commercial_agreements', 'resident_facilities', 'resident_additional_charges',
        'mess_configurations', 'messes', 'mess_building_assignments', 'mess_meal_types',
        'mess_meal_plans', 'mess_menus', 'mess_menu_items', 'resident_mess_subscriptions',
        'mess_meal_consumptions', 'mess_inventory_items', 'mess_inventory_transactions',
        'mess_vendors', 'mess_procurements', 'mess_procurement_items', 'mess_expenses'
      )
    ORDER BY table_name ASC, ordinal_position ASC
  `.execute(db);
  console.table(colsRes.rows);

  // 2. Audit Money Precision Columns Across M7.1, M7.2, M7.3
  console.log('\n--- 2. MONEY PRECISION AUDIT (NUMERIC(12,2)) ---');
  const moneyColsRes = await sql<{
    table_name: string;
    column_name: string;
    data_type: string;
    numeric_precision: number | null;
    numeric_scale: number | null;
  }>`
    SELECT table_name, column_name, data_type, numeric_precision, numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        column_name LIKE '%amount%' OR column_name LIKE '%price%' OR column_name LIKE '%charge%' OR
        column_name LIKE '%deposit%' OR column_name LIKE '%rent%' OR column_name LIKE '%total%'
      )
      AND data_type NOT IN ('uuid', 'boolean', 'character varchar', 'text')
    ORDER BY table_name ASC, column_name ASC
  `.execute(db);
  console.table(moneyColsRes.rows);

  // 3. Audit Foreign Keys & Composite Tenant Constraints
  console.log('\n--- 3. FOREIGN KEY CONSTRAINTS (M7.1 & M7.2) ---');
  const fkRes = await sql<{
    constraint_name: string;
    table_name: string;
    foreign_table_name: string;
  }>`
    SELECT
      tc.constraint_name,
      tc.table_name,
      ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.constraint_column_usage AS ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name ASC, tc.constraint_name ASC
  `.execute(db);
  console.table(fkRes.rows);

  // 4. Audit Indexes & Partial Unique Indexes
  console.log('\n--- 4. INDEXES & PARTIAL UNIQUE INDEXES (M7.1 & M7.2) ---');
  const indexRes = await sql<{
    tablename: string;
    indexname: string;
    indexdef: string;
  }>`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN (
        'resident_commercial_agreements', 'resident_facilities', 'resident_additional_charges',
        'resident_mess_subscriptions', 'mess_meal_consumptions', 'mess_inventory_items',
        'mess_procurements', 'mess_expenses'
      )
    ORDER BY tablename ASC, indexname ASC
  `.execute(db);
  console.table(indexRes.rows);

  // 5. Audit CHECK Constraints
  console.log('\n--- 5. CHECK CONSTRAINTS ---');
  const checkRes = await sql<{
    relname: string;
    conname: string;
    consrc: string;
  }>`
    SELECT 
      c.relname,
      con.conname,
      pg_get_constraintdef(con.oid) as consrc
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND con.contype = 'c'
    ORDER BY c.relname ASC, con.conname ASC
  `.execute(db);
  console.table(checkRes.rows);

  await dbService.shutdown();
}

runForensicAudit().catch(console.error);
