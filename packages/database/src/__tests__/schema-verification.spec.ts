import { describe, expect, it } from 'vitest';
import { dbService } from '../connection/database';
import { MigrationService, REQUIRED_SCHEMA_TABLES } from '../migrations/migrator';

describe('Database Migration & Schema Drift Verification Specification', () => {
  const migrationService = new MigrationService(dbService.db);

  it('1. Migration registry contains all 16 registered migrations in deterministic order', async () => {
    const status = await migrationService.getMigrationStatus();
    expect(status.length).toBe(16);
    expect(status[0].name).toBe('00001_auth_schema');
    expect(status[5].name).toBe('00006_commercial_management_schema');
    expect(status[6].name).toBe('00007_mess_management_schema');
    expect(status[7].name).toBe('00008_billing_payments_schema');
    expect(status[8].name).toBe('00009_billing_financial_integrity_hardening');
    expect(status[9].name).toBe('00010_schema_drift_reconciliation');
    expect(status[10].name).toBe('00011_mess_subscription_superseded_status');
    expect(status[11].name).toBe('00012_billing_operations_performance_indexes');
    expect(status[12].name).toBe('00013_inventory_procurement_performance_indexes');
    expect(status[13].name).toBe('00014_notifications_schema');
    expect(status[14].name).toBe('00015_tasks_schema');
    expect(status[15].name).toBe('00016_staff_role_scope_schema');
  });

  it('2. All migrations in history are marked APPLIED', async () => {
    const status = await migrationService.getMigrationStatus();
    const pending = status.filter((s) => s.status === 'PENDING');
    expect(pending.length).toBe(0);
  });

  it('3. Schema readiness check passes with 0 missing required tables', async () => {
    const readiness = await migrationService.verifySchemaReadiness();
    expect(readiness.missingTables).toEqual([]);
    expect(readiness.pendingMigrations).toEqual([]);
    expect(readiness.isReady).toBe(true);
  });

  it('4. M7.1 Commercial tables exist physically in PostgreSQL', async () => {
    const readiness = await migrationService.verifySchemaReadiness();
    for (const table of REQUIRED_SCHEMA_TABLES.M7_1) {
      expect(readiness.missingTables).not.toContain(table);
    }
  });

  it('5. M7.2 Mess tables exist physically in PostgreSQL', async () => {
    const readiness = await migrationService.verifySchemaReadiness();
    for (const table of REQUIRED_SCHEMA_TABLES.M7_2) {
      expect(readiness.missingTables).not.toContain(table);
    }
  });

  it('6. M7.3 Billing tables exist physically in PostgreSQL', async () => {
    const readiness = await migrationService.verifySchemaReadiness();
    for (const table of REQUIRED_SCHEMA_TABLES.M7_3) {
      expect(readiness.missingTables).not.toContain(table);
    }
  });

  it('7. M20 Notification tables exist physically in PostgreSQL', async () => {
    const readiness = await migrationService.verifySchemaReadiness();
    for (const table of REQUIRED_SCHEMA_TABLES.M20) {
      expect(readiness.missingTables).not.toContain(table);
    }
  });

  it('8. M21 Task Management tables exist physically in PostgreSQL', async () => {
    const readiness = await migrationService.verifySchemaReadiness();
    for (const table of REQUIRED_SCHEMA_TABLES.M21) {
      expect(readiness.missingTables).not.toContain(table);
    }
  });

  it('9. M22 Staff Management tables exist physically in PostgreSQL', async () => {
    const readiness = await migrationService.verifySchemaReadiness();
    for (const table of REQUIRED_SCHEMA_TABLES.M22) {
      expect(readiness.missingTables).not.toContain(table);
    }
  });
});
