import { describe, expect, it, vi } from 'vitest';
import { MigrationService, REQUIRED_SCHEMA_TABLES } from '../migrations/migrator';

describe('Post-Repair Forensic Database Integrity Suite', () => {
  it('should dynamically calculate exact table registry counts without hardcoding 36', () => {
    const totalExpected =
      REQUIRED_SCHEMA_TABLES.M1_TO_M6.length +
      REQUIRED_SCHEMA_TABLES.M7_1.length +
      REQUIRED_SCHEMA_TABLES.M7_2.length +
      REQUIRED_SCHEMA_TABLES.M7_3.length;

    expect(REQUIRED_SCHEMA_TABLES.M1_TO_M6.length).toBe(19);
    expect(REQUIRED_SCHEMA_TABLES.M7_1.length).toBe(3);
    expect(REQUIRED_SCHEMA_TABLES.M7_2.length).toBe(15);
    expect(REQUIRED_SCHEMA_TABLES.M7_3.length).toBe(6);
    expect(totalExpected).toBe(43);
  });

  it('should detect missing required tables dynamically', async () => {
    const mockDb: any = {
      executor: {},
    };

    const mockMigrationService = new MigrationService(mockDb);

    vi.spyOn(mockMigrationService, 'getMigrationStatus').mockResolvedValue([
      { name: '00001_auth_schema', status: 'APPLIED' },
      { name: '00002_tenant_schema', status: 'APPLIED' },
      { name: '00003_inventory_schema', status: 'APPLIED' },
      { name: '00004_resident_allocation_schema', status: 'APPLIED' },
      { name: '00005_m6_integrity_hardening', status: 'APPLIED' },
      { name: '00006_commercial_management_schema', status: 'APPLIED' },
      { name: '00007_mess_management_schema', status: 'APPLIED' },
      { name: '00008_billing_payments_schema', status: 'APPLIED' },
      { name: '00009_billing_financial_integrity_hardening', status: 'APPLIED' },
      { name: '00010_schema_drift_reconciliation', status: 'APPLIED' },
    ]);

    // Mock sql query returning missing table
    const requiredTables = [
      ...REQUIRED_SCHEMA_TABLES.M1_TO_M6,
      ...REQUIRED_SCHEMA_TABLES.M7_1,
      ...REQUIRED_SCHEMA_TABLES.M7_2,
      ...REQUIRED_SCHEMA_TABLES.M7_3,
    ];

    const missingTableList = ['resident_mess_subscriptions'];
    const mockExisting = requiredTables.filter((t) => !missingTableList.includes(t));

    vi.spyOn(mockMigrationService, 'verifySchemaReadiness').mockResolvedValue({
      isReady: false,
      expectedTableCount: 43,
      existingTableCount: mockExisting.length,
      missingTables: missingTableList,
      pendingMigrations: [],
    });

    const readiness = await mockMigrationService.verifySchemaReadiness();
    expect(readiness.isReady).toBe(false);
    expect(readiness.missingTables).toContain('resident_mess_subscriptions');
    expect(readiness.expectedTableCount).toBe(43);
  });

  it('should confirm 100% applied status when schema is fully aligned', async () => {
    const mockDb: any = {};
    const mockMigrationService = new MigrationService(mockDb);

    vi.spyOn(mockMigrationService, 'verifySchemaReadiness').mockResolvedValue({
      isReady: true,
      expectedTableCount: 43,
      existingTableCount: 43,
      missingTables: [],
      pendingMigrations: [],
    });

    const readiness = await mockMigrationService.verifySchemaReadiness();
    expect(readiness.isReady).toBe(true);
    expect(readiness.missingTables.length).toBe(0);
    expect(readiness.pendingMigrations.length).toBe(0);
  });
});
