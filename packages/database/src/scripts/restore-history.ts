import { dbService } from '../connection/database';
import { sql } from 'kysely';

async function restoreHistory() {
  const db = dbService.db;
  console.log('Restoring kysely_migration sequential records for 00006 and 00007...');

  await sql`
    INSERT INTO kysely_migration (name, timestamp)
    VALUES ('00006_commercial_management_schema', '2026-08-12T19:34:46.527Z')
    ON CONFLICT (name) DO NOTHING
  `.execute(db);

  await sql`
    INSERT INTO kysely_migration (name, timestamp)
    VALUES ('00007_mess_management_schema', '2026-08-12T19:34:46.528Z')
    ON CONFLICT (name) DO NOTHING
  `.execute(db);

  console.log('✅ kysely_migration sequential order restored!');
  await dbService.shutdown();
}

restoreHistory().catch(console.error);
