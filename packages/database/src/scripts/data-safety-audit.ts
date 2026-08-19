import { dbService } from '../connection/database';
import { sql } from 'kysely';

async function auditDataSafety() {
  const db = dbService.db;
  console.log('=== DATA SAFETY AUDIT — BEFORE REPAIR ===');

  const m1_m6_tables = [
    'users',
    'organizations',
    'organization_memberships',
    'properties',
    'buildings',
    'floors',
    'rooms',
    'beds',
    'residents',
    'stays',
    'bed_allocations',
  ];

  const counts: Record<string, number> = {};

  for (const table of m1_m6_tables) {
    try {
      const res = await sql<{
        count: number;
      }>`SELECT COUNT(*)::int as count FROM ${sql.table(table)}`.execute(db);
      counts[table] = res.rows[0]?.count ?? 0;
    } catch (err: any) {
      counts[table] = -1; // Missing table
    }
  }

  console.table(counts);

  const m73_tables = [
    'billing_configurations',
    'invoices',
    'invoice_items',
    'payments',
    'payment_allocations',
    'receipts',
  ];

  const m73_counts: Record<string, number> = {};
  for (const table of m73_tables) {
    try {
      const res = await sql<{
        count: number;
      }>`SELECT COUNT(*)::int as count FROM ${sql.table(table)}`.execute(db);
      m73_counts[table] = res.rows[0]?.count ?? 0;
    } catch (err: any) {
      m73_counts[table] = -1;
    }
  }
  console.log('\n--- M7.3 BILLING TABLES COUNTS ---');
  console.table(m73_counts);

  await dbService.shutdown();
}

auditDataSafety().catch(console.error);
