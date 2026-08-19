"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationService = exports.REQUIRED_SCHEMA_TABLES = void 0;
const kysely_1 = require("kysely");
const logger_1 = require("@m-square/logger");
const m00001 = __importStar(require("./00001_auth_schema"));
const m00002 = __importStar(require("./00002_tenant_schema"));
const m00003 = __importStar(require("./00003_inventory_schema"));
const m00004 = __importStar(require("./00004_resident_allocation_schema"));
const m00005 = __importStar(require("./00005_m6_integrity_hardening"));
const m00006 = __importStar(require("./00006_commercial_management_schema"));
const m00007 = __importStar(require("./00007_mess_management_schema"));
const m00008 = __importStar(require("./00008_billing_payments_schema"));
const m00009 = __importStar(require("./00009_billing_financial_integrity_hardening"));
const m00010 = __importStar(require("./00010_schema_drift_reconciliation"));
const m00011 = __importStar(require("./00011_mess_subscription_superseded_status"));
const m00012 = __importStar(require("./00012_billing_operations_performance_indexes"));
const m00013 = __importStar(require("./00013_inventory_procurement_performance_indexes"));
const m00014 = __importStar(require("./00014_notifications_schema"));
const m00015 = __importStar(require("./00015_tasks_schema"));
const m00016 = __importStar(require("./00016_staff_role_scope_schema"));
exports.REQUIRED_SCHEMA_TABLES = {
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
class MigrationService {
    db;
    constructor(db) {
        this.db = db;
    }
    getMigrator() {
        return new kysely_1.Migrator({
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
    async migrateToLatest() {
        const migrator = this.getMigrator();
        const { error, results } = await migrator.migrateToLatest();
        results?.forEach((it) => {
            if (it.status === 'Success') {
                logger_1.logger.info(`Migration '${it.migrationName}' executed successfully`);
            }
            else if (it.status === 'Error') {
                logger_1.logger.error(`Migration '${it.migrationName}' failed`);
            }
        });
        if (error) {
            logger_1.logger.error('Migration execution failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Returns complete migration status list.
     */
    async getMigrationStatus() {
        const migrator = this.getMigrator();
        const migrations = await migrator.getMigrations();
        const appliedNames = {};
        try {
            const res = await (0, kysely_1.sql) `SELECT name, timestamp FROM kysely_migration`.execute(this.db);
            for (const r of res.rows) {
                appliedNames[r.name] = r.timestamp;
            }
        }
        catch {
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
    async verifySchemaReadiness() {
        const allRequiredTables = [
            ...exports.REQUIRED_SCHEMA_TABLES.M1_TO_M6,
            ...exports.REQUIRED_SCHEMA_TABLES.M7_1,
            ...exports.REQUIRED_SCHEMA_TABLES.M7_2,
            ...exports.REQUIRED_SCHEMA_TABLES.M7_3,
            ...exports.REQUIRED_SCHEMA_TABLES.M20,
            ...exports.REQUIRED_SCHEMA_TABLES.M21,
        ];
        const physicalTablesRes = await (0, kysely_1.sql) `
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
    async rollbackDevelopmentStep() {
        const migrator = this.getMigrator();
        const { error, results } = await migrator.migrateDown();
        results?.forEach((it) => {
            logger_1.logger.info(`Development rollback '${it.migrationName}' executed`);
        });
        if (error) {
            logger_1.logger.error('Development rollback failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Reverts all migrations (testing environment reset only).
     */
    async resetTestDatabase() {
        const migrator = this.getMigrator();
        await migrator.migrateTo(kysely_1.NO_MIGRATIONS);
    }
}
exports.MigrationService = MigrationService;
//# sourceMappingURL=migrator.js.map