import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('notifications')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
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
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn('read_at', 'timestamptz')
    .addColumn('resolved_at', 'timestamptz')
    .addColumn('expires_at', 'timestamptz')
    .addCheckConstraint(
      'check_notification_status',
      sql`status IN ('UNREAD', 'READ', 'RESOLVED', 'DISMISSED')`
    )
    .addCheckConstraint(
      'check_notification_severity',
      sql`severity IN ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL')`
    )
    .execute();

  await sql`
    CREATE INDEX IF NOT EXISTS idx_notifications_org_id
    ON notifications (organization_id)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_notifications_org_status
    ON notifications (organization_id, status)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_notifications_org_created_at
    ON notifications (organization_id, created_at DESC)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_notifications_org_type
    ON notifications (organization_id, type)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_notifications_org_severity
    ON notifications (organization_id, severity)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_notifications_org_read_at
    ON notifications (organization_id, read_at)
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe
    ON notifications (organization_id, dedupe_key)
    WHERE dedupe_key IS NOT NULL AND status NOT IN ('RESOLVED', 'DISMISSED')
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_notifications_dedupe`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_notifications_org_read_at`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_notifications_org_severity`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_notifications_org_type`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_notifications_org_created_at`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_notifications_org_status`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_notifications_org_id`.execute(db);
  await db.schema.dropTable('notifications').ifExists().execute();
}
