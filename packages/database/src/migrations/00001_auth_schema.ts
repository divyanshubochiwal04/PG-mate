import { type Kysely, sql } from 'kysely';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  // 1. Users Table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('email_verified_at', 'timestamptz')
    .addColumn('last_login_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await sql`CREATE UNIQUE INDEX idx_users_email_lower ON users (LOWER(email))`.execute(db);
  await db.schema.createIndex('idx_users_status').on('users').column('status').execute();

  // 2. User Sessions Table
  await db.schema
    .createTable('user_sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('ip_address', 'varchar(45)')
    .addColumn('user_agent', 'varchar(500)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('last_used_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('revoked_at', 'timestamptz')
    .addColumn('revocation_reason', 'varchar(250)')
    .execute();

  await db.schema
    .createIndex('idx_sessions_user_id')
    .on('user_sessions')
    .column('user_id')
    .execute();

  // 3. Refresh Tokens Table
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('session_id', 'uuid', (col) =>
      col.notNull().references('user_sessions.id').onDelete('cascade')
    )
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('used_at', 'timestamptz')
    .execute();

  await db.schema
    .createIndex('idx_refresh_tokens_session_id')
    .on('refresh_tokens')
    .column('session_id')
    .execute();
  await db.schema
    .createIndex('idx_refresh_tokens_hash')
    .on('refresh_tokens')
    .column('token_hash')
    .execute();

  // 4. Password Reset Tokens Table
  await db.schema
    .createTable('password_reset_tokens')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull().unique())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('used_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_reset_token_hash')
    .on('password_reset_tokens')
    .column('token_hash')
    .execute();
  await db.schema
    .createIndex('idx_reset_user_id')
    .on('password_reset_tokens')
    .column('user_id')
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('password_reset_tokens').execute();
  await db.schema.dropTable('refresh_tokens').execute();
  await db.schema.dropTable('user_sessions').execute();
  await db.schema.dropTable('users').execute();
}
