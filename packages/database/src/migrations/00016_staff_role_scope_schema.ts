import { type Kysely, sql } from 'kysely';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  // 1. Staff Profiles Table
  await db.schema
    .createTable('staff_profiles')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('employee_code', 'varchar(100)', (col) => col.notNull())
    .addColumn('display_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('phone', 'varchar(50)')
    .addColumn('role', 'varchar(50)', (col) => col.notNull().defaultTo('STAFF'))
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_staff_org_emp_code')
    .unique()
    .on('staff_profiles')
    .columns(['organization_id', 'employee_code'])
    .execute();

  await db.schema
    .createIndex('idx_staff_org_user')
    .unique()
    .on('staff_profiles')
    .columns(['organization_id', 'user_id'])
    .execute();

  await db.schema
    .createIndex('idx_staff_org_role')
    .on('staff_profiles')
    .columns(['organization_id', 'role'])
    .execute();

  await db.schema
    .createIndex('idx_staff_org_status')
    .on('staff_profiles')
    .columns(['organization_id', 'status'])
    .execute();

  await sql`
    ALTER TABLE staff_profiles
    ADD CONSTRAINT chk_staff_role
    CHECK (role IN ('OWNER', 'MANAGER', 'STAFF'));
  `.execute(db);

  await sql`
    ALTER TABLE staff_profiles
    ADD CONSTRAINT chk_staff_status
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DISABLED'));
  `.execute(db);

  // 2. User Property Scopes Table
  await db.schema
    .createTable('user_property_scopes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('property_id', 'uuid', (col) =>
      col.notNull().references('properties.id').onDelete('cascade')
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_user_prop_scopes_unique')
    .unique()
    .on('user_property_scopes')
    .columns(['organization_id', 'user_id', 'property_id'])
    .execute();

  // 3. User Building Scopes Table
  await db.schema
    .createTable('user_building_scopes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('building_id', 'uuid', (col) =>
      col.notNull().references('buildings.id').onDelete('cascade')
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_user_bldg_scopes_unique')
    .unique()
    .on('user_building_scopes')
    .columns(['organization_id', 'user_id', 'building_id'])
    .execute();

  // 4. User Permission Overrides Table
  await db.schema
    .createTable('user_permission_overrides')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('cascade')
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('permission', 'varchar(100)', (col) => col.notNull())
    .addColumn('is_granted', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .execute();

  await db.schema
    .createIndex('idx_user_perm_overrides_unique')
    .unique()
    .on('user_permission_overrides')
    .columns(['organization_id', 'user_id', 'permission'])
    .execute();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_permission_overrides').execute();
  await db.schema.dropTable('user_building_scopes').execute();
  await db.schema.dropTable('user_property_scopes').execute();
  await db.schema.dropTable('staff_profiles').execute();
}
