import { type Kysely } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
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
export declare const REQUIRED_SCHEMA_TABLES: {
    M1_TO_M6: string[];
    M7_1: string[];
    M7_2: string[];
    M7_3: string[];
    M20: string[];
    M21: string[];
    M22: string[];
};
export declare class MigrationService {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    private getMigrator;
    /**
     * Executes all pending `up` migrations in deterministic order.
     */
    migrateToLatest(): Promise<void>;
    /**
     * Returns complete migration status list.
     */
    getMigrationStatus(): Promise<MigrationStatusItem[]>;
    /**
     * Queries PostgreSQL `information_schema.tables` to verify schema completeness.
     */
    verifySchemaReadiness(): Promise<SchemaReadinessResult>;
    /**
     * Development-only rollback of the last migration step.
     */
    rollbackDevelopmentStep(): Promise<void>;
    /**
     * Reverts all migrations (testing environment reset only).
     */
    resetTestDatabase(): Promise<void>;
}
//# sourceMappingURL=migrator.d.ts.map