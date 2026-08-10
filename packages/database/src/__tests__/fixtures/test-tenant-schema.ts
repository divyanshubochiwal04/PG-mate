import { type Kysely, sql } from 'kysely';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function upTestFixture(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('test_tenant_resources')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_test_resources_org_id_id')
    .ifNotExists()
    .on('test_tenant_resources')
    .columns(['organization_id', 'id'])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function downTestFixture(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('test_tenant_resources').ifExists().execute();
}
