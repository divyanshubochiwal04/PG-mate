import { dbService } from './connection/database';
import { sql } from 'kysely';

async function audit() {
  const db = dbService.db;
  console.log('=== LIVE POSTGRESQL DATABASE AUDIT ===');

  const connInfo = await sql<{
    current_database: string;
    current_schema: string;
  }>`SELECT current_database(), current_schema()`.execute(db);
  console.log('Database Name:', connInfo.rows[0].current_database);
  console.log('Current Schema:', connInfo.rows[0].current_schema);

  console.log('\n--- KYSELY MIGRATION HISTORY TABLE ---');
  try {
    const migrations = await sql<{
      name: string;
      timestamp: string;
    }>`SELECT name, timestamp FROM kysely_migration ORDER BY name ASC`.execute(db);
    console.table(migrations.rows);
  } catch (err: any) {
    console.error('Error reading kysely_migration table:', err.message);
  }

  console.log('\n--- PHYSICAL TABLES IN DATABASE ---');
  const tableRes = await sql<{
    table_name: string;
  }>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name ASC`.execute(
    db
  );
  const tableNames = tableRes.rows.map((r) => r.table_name);
  console.log(`Total Tables Count: ${tableNames.length}`);
  console.log(tableNames.join(', '));

  const requiredTables = [
    // M6
    'residents',
    'stays',
    'bed_allocations',
    // M7.1
    'resident_commercial_agreements',
    'resident_facilities',
    'resident_additional_charges',
    // M7.2 Mess
    'mess_configurations',
    'messes',
    'mess_building_assignments',
    'mess_meal_types',
    'mess_meal_plans',
    'mess_menus',
    'mess_menu_items',
    'resident_mess_subscriptions',
    'mess_meal_consumptions',
    'mess_inventory_items',
    'mess_inventory_transactions',
    'mess_vendors',
    'mess_procurements',
    'mess_procurement_items',
    'mess_expenses',
    // M7.3 Billing
    'billing_configurations',
    'invoices',
    'invoice_items',
    'payments',
    'payment_allocations',
    'receipts',
  ];

  console.log('\n--- TABLE CHECK MATRIX ---');
  const checkMatrix = requiredTables.map((tbl) => ({
    tableName: tbl,
    exists: tableNames.includes(tbl) ? '✅ EXISTS' : '❌ MISSING',
  }));
  console.table(checkMatrix);

  await dbService.shutdown();
}

audit().catch(console.error);
