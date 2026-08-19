"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await db.schema
        .createTable('notifications')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull().references('organizations.id').onDelete('cascade'))
        .addColumn('type', 'varchar(50)', (col) => col.notNull())
        .addColumn('severity', 'varchar(20)', (col) => col.notNull().defaultTo('INFO'))
        .addColumn('title', 'varchar(255)', (col) => col.notNull())
        .addColumn('message', 'text', (col) => col.notNull())
        .addColumn('entity_type', 'varchar(50)')
        .addColumn('entity_id', 'uuid')
        .addColumn('action_route', 'varchar(255)')
        .addColumn('metadata', 'jsonb')
        .addColumn('dedupe_key', 'varchar(255)')
        .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('UNREAD'))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `CURRENT_TIMESTAMP`))
        .addColumn('read_at', 'timestamptz')
        .addColumn('resolved_at', 'timestamptz')
        .addColumn('expires_at', 'timestamptz')
        .addCheckConstraint('check_notification_status', (0, kysely_1.sql) `status IN ('UNREAD', 'READ', 'RESOLVED', 'DISMISSED')`)
        .addCheckConstraint('check_notification_severity', (0, kysely_1.sql) `severity IN ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL')`)
        .execute();
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS idx_notifications_org_id
    ON notifications (organization_id)
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS idx_notifications_org_status
    ON notifications (organization_id, status)
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS idx_notifications_org_created_at
    ON notifications (organization_id, created_at DESC)
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS idx_notifications_org_type
    ON notifications (organization_id, type)
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS idx_notifications_org_severity
    ON notifications (organization_id, severity)
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS idx_notifications_org_read_at
    ON notifications (organization_id, read_at)
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
    ON notifications (organization_id, dedupe_key)
    WHERE dedupe_key IS NOT NULL AND status NOT IN ('RESOLVED', 'DISMISSED')
  `.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_notifications_dedupe`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_notifications_org_read_at`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_notifications_org_severity`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_notifications_org_type`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_notifications_org_created_at`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_notifications_org_status`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_notifications_org_id`.execute(db);
    await db.schema.dropTable('notifications').ifExists().execute();
}
//# sourceMappingURL=00014_notifications_schema.js.map