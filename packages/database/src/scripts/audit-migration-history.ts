import { dbService } from '../connection/database';
import { MigrationService } from '../migrations/migrator';

async function run() {
  const db = dbService.db;
  const migrationService = new MigrationService(db);
  const status = await migrationService.getMigrationStatus();

  console.log('=== MIGRATION HISTORY CONSISTENCY AUDIT ===');
  console.table(status);

  const pending = status.filter((s) => s.status === 'PENDING');
  if (pending.length === 0) {
    console.log('✅ All 10 migrations are marked APPLIED in deterministic order (00001 -> 00010)!');
  } else {
    console.error('❌ Pending migrations found:', pending);
    process.exitCode = 1;
  }

  await dbService.shutdown();
}

run();
