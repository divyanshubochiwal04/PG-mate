import { type Kysely, sql } from 'kysely';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  // 1. Organizations Table
  await db.schema
    .createTable('organizations')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('slug', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_organizations_status')
    .on('organizations')
    .column('status')
    .execute();

  // 2. Organization Memberships Table (0 or 1 Membership per User)
  await db.schema
    .createTable('organization_memberships')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_org_memberships_user_id')
    .unique()
    .on('organization_memberships')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_org_memberships_org_user')
    .on('organization_memberships')
    .columns(['organization_id', 'user_id'])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('organization_memberships').execute();
  await db.schema.dropTable('organizations').execute();
}
