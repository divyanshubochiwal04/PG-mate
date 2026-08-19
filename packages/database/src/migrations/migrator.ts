import { type Kysely, Migrator, NO_MIGRATIONS, sql } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import { logger } from '@m-square/logger';
import * as m00001 from './00001_auth_schema';
import * as m00002 from './00002_tenant_schema';
import * as m00003 from './00003_inventory_schema';
import * as m00004 from './00004_resident_allocation_schema';
import * as m00005 from './00005_m6_integrity_hardening';
import * as m00006 from './00006_commercial_management_schema';
import * as m00007 from './00007_mess_management_schema';
import * as m00008 from './00008_billing_payments_schema';
import * as m00009 from './00009_billing_financial_integrity_hardening';
import * as m00010 from './00010_schema_drift_reconciliation';
import * as m00011 from './00011_mess_subscription_superseded_status';
import * as m00012 from './00012_billing_operations_performance_indexes';
import * as m00013 from './00013_inventory_procurement_performance_indexes';
import * as m00014 from './00014_notifications_schema';
import * as m00015 from './00015_tasks_schema';
import * as m00016 from './00016_staff_role_scope_schema';

export interface MigrationStatusItem {
  name: string;
  status: 'APPLIED' | 'PENDING';
  executedAt?: string;
}

export interface SchemaReadinessResult {
  isReady: boolean;
  expectedTableCount: number;
  existingTableCount: number;
  missingTables: string[];
  pendingMigrations: string[];
}

export const REQUIRED_SCHEMA_TABLES = {
  M1_TO_M6: [
    'users',
    'user_sessions',
    'refresh_tokens',
    'organizations',
    'organization_memberships',
    'organization_counters',
    'properties',
    'buildings',
    'floors',
    'rooms',
    'beds',
    'facilities',
    'property_facilities',
    'building_facilities',
    'room_facilities',
    'residents',
    'emergency_contacts',
    'stays',
    'bed_allocations',
  ],
  M7_1: ['resident_commercial_agreements', 'resident_facilities', 'resident_additional_charges'],
  M7_2: [
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
  ],
  M7_3: [
    'billing_configurations',
    'invoices',
    'invoice_items',
    'payments',
    'payment_allocations',
    'receipts',
  ],
  M20: ['notifications'],
  M21: ['tasks', 'task_activities'],
  M22: [
    'staff_profiles',
    'user_property_scopes',
    'user_building_scopes',
    'user_permission_overrides',
  ],
};

export class MigrationService {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private getMigrator(): Migrator {
    return new Migrator({
      db: this.db,
      provider: {
        getMigrations: async () => ({
          '00001_auth_schema': m00001,
          '00002_tenant_schema': m00002,
          '00003_inventory_schema': m00003,
          '00004_resident_allocation_schema': m00004,
          '00005_m6_integrity_hardening': m00005,
          '00006_commercial_management_schema': m00006,
          '00007_mess_management_schema': m00007,
          '00008_billing_payments_schema': m00008,
          '00009_billing_financial_integrity_hardening': m00009,
          '00010_schema_drift_reconciliation': m00010,
          '00011_mess_subscription_superseded_status': m00011,
          '00012_billing_operations_performance_indexes': m00012,
          '00013_inventory_procurement_performance_indexes': m00013,
          '00014_notifications_schema': m00014,
          '00015_tasks_schema': m00015,
          '00016_staff_role_scope_schema': m00016,
        }),
      },
    });
  }

  /**
   * Executes all pending `up` migrations in deterministic order.
   */
  public async migrateToLatest(): Promise<void> {
    const migrator = this.getMigrator();
    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((it) => {
      if (it.status === 'Success') {
        logger.info(`Migration '${it.migrationName}' executed successfully`);
      } else if (it.status === 'Error') {
        logger.error(`Migration '${it.migrationName}' failed`);
      }
    });

    if (error) {
      logger.error('Migration execution failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Returns complete migration status list.
   */
  public async getMigrationStatus(): Promise<MigrationStatusItem[]> {
    const migrator = this.getMigrator();
    const migrations = await migrator.getMigrations();

    const appliedNames: Record<string, string> = {};
    try {
      const res = await sql<{
        name: string;
        timestamp: string;
      }>`SELECT name, timestamp FROM kysely_migration`.execute(this.db);
      for (const r of res.rows) {
        appliedNames[r.name] = r.timestamp;
      }
    } catch {
      // History table does not exist yet
    }

    return migrations.map((m) => {
      const isApplied = !!appliedNames[m.name];
      return {
        name: m.name,
        status: isApplied ? 'APPLIED' : 'PENDING',
        executedAt: appliedNames[m.name],
      };
    });
  }

  /**
   * Queries PostgreSQL `information_schema.tables` to verify schema completeness.
   */
  public async verifySchemaReadiness(): Promise<SchemaReadinessResult> {
    const allRequiredTables = [
      ...REQUIRED_SCHEMA_TABLES.M1_TO_M6,
      ...REQUIRED_SCHEMA_TABLES.M7_1,
      ...REQUIRED_SCHEMA_TABLES.M7_2,
      ...REQUIRED_SCHEMA_TABLES.M7_3,
      ...REQUIRED_SCHEMA_TABLES.M20,
      ...REQUIRED_SCHEMA_TABLES.M21,
    ];

    const physicalTablesRes = await sql<{ table_name: string }>`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `.execute(this.db);

    const existingTables = new Set(physicalTablesRes.rows.map((r) => r.table_name));
    const missingTables = allRequiredTables.filter((tbl) => !existingTables.has(tbl));

    const statusList = await this.getMigrationStatus();
    const pendingMigrations = statusList.filter((s) => s.status === 'PENDING').map((s) => s.name);

    return {
      isReady: missingTables.length === 0 && pendingMigrations.length === 0,
      expectedTableCount: allRequiredTables.length,
      existingTableCount: existingTables.size,
      missingTables,
      pendingMigrations,
    };
  }

  /**
   * Development-only rollback of the last migration step.
   */
  public async rollbackDevelopmentStep(): Promise<void> {
    const migrator = this.getMigrator();
    const { error, results } = await migrator.migrateDown();

    results?.forEach((it) => {
      logger.info(`Development rollback '${it.migrationName}' executed`);
    });

    if (error) {
      logger.error('Development rollback failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Reverts all migrations (testing environment reset only).
   */
  public async resetTestDatabase(): Promise<void> {
    const migrator = this.getMigrator();
    await migrator.migrateTo(NO_MIGRATIONS);
  }
}
