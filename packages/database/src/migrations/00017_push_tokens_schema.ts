import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('user_push_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('push_token', 'varchar(255)', (col) => col.notNull())
    .addColumn('device_type', 'varchar(50)', (col) => col.notNull().defaultTo('ANDROID'))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_push_tokens_unique
    ON user_push_tokens (user_id, push_token)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_user_push_tokens_org
    ON user_push_tokens (organization_id)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('user_push_tokens').ifExists().execute();
}
