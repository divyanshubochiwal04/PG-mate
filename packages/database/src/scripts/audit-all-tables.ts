import { dbService } from '../connection/database';
import { sql } from 'kysely';

async function auditAllTables() {
  const db = dbService.db;
  const res = await sql<{ table_name: string }>`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name ASC
  `.execute(db);

  console.log('=== ALL PHYSICAL BASE TABLES IN POSTGRESQL ("public") ===');
  console.log(`Total Tables Found in PostgreSQL: ${res.rows.length}`);
  console.table(res.rows);

  await dbService.shutdown();
}

auditAllTables().catch(console.error);
