"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function up(db) {
    // 1. Organizations Table
    await db.schema
        .createTable('organizations')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .addColumn('slug', 'varchar(100)', (col) => col.notNull().unique())
        .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .execute();
    await db.schema
        .createIndex('idx_organizations_status')
        .on('organizations')
        .column('status')
        .execute();
    // 2. Organization Memberships Table (0 or 1 Membership per User)
    await db.schema
        .createTable('organization_memberships')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull().references('organizations.id').onDelete('cascade'))
        .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id').onDelete('cascade'))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
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
async function down(db) {
    await db.schema.dropTable('organization_memberships').execute();
    await db.schema.dropTable('organizations').execute();
}
//# sourceMappingURL=00002_tenant_schema.js.map