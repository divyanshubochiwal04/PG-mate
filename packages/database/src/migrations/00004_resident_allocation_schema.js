"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    // 1. Organization Counters Table (for concurrency-safe human-readable codes)
    await db.schema
        .createTable('organization_counters')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('counter_type', 'varchar(50)', (col) => col.notNull())
        .addColumn('current_value', 'integer', (col) => col.notNull().defaultTo(0))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addForeignKeyConstraint('fk_org_counters_organization', ['organization_id'], 'organizations', ['id'], (cb) => cb.onDelete('cascade'))
        .addUniqueConstraint('unique_org_counter', ['organization_id', 'counter_type'])
        .execute();
    // 2. Residents Table
    await db.schema
        .createTable('residents')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('resident_code', 'varchar(50)', (col) => col.notNull())
        .addColumn('first_name', 'varchar(100)', (col) => col.notNull())
        .addColumn('middle_name', 'varchar(100)')
        .addColumn('last_name', 'varchar(100)', (col) => col.notNull())
        .addColumn('preferred_name', 'varchar(100)')
        .addColumn('date_of_birth', 'date')
        .addColumn('gender', 'varchar(20)', (col) => col.notNull())
        .addColumn('phone', 'varchar(20)', (col) => col.notNull())
        .addColumn('alternate_phone', 'varchar(20)')
        .addColumn('email', 'varchar(255)')
        .addColumn('address_line1', 'varchar(255)')
        .addColumn('city', 'varchar(100)')
        .addColumn('state', 'varchar(100)')
        .addColumn('postal_code', 'varchar(20)')
        .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addForeignKeyConstraint('fk_residents_organization', ['organization_id'], 'organizations', ['id'], (cb) => cb.onDelete('restrict'))
        .addUniqueConstraint('unique_resident_id_org', ['id', 'organization_id'])
        .addUniqueConstraint('unique_resident_code_org', ['organization_id', 'resident_code'])
        .addCheckConstraint('check_residents_status', (0, kysely_1.sql) `status IN ('ACTIVE', 'INACTIVE')`)
        .addCheckConstraint('check_residents_gender', (0, kysely_1.sql) `gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY')`)
        .execute();
    // 3. Emergency Contacts Table
    await db.schema
        .createTable('emergency_contacts')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('resident_id', 'uuid', (col) => col.notNull())
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('name', 'varchar(200)', (col) => col.notNull())
        .addColumn('relationship', 'varchar(50)', (col) => col.notNull())
        .addColumn('phone', 'varchar(20)', (col) => col.notNull())
        .addColumn('alternate_phone', 'varchar(20)')
        .addColumn('is_primary', 'boolean', (col) => col.notNull().defaultTo(true))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addForeignKeyConstraint('fk_emergency_contacts_resident_org', ['resident_id', 'organization_id'], 'residents', ['id', 'organization_id'], (cb) => cb.onDelete('cascade'))
        .addCheckConstraint('check_emergency_contacts_relationship', (0, kysely_1.sql) `relationship IN ('PARENT', 'GUARDIAN', 'SIBLING', 'SPOUSE', 'FRIEND', 'OTHER')`)
        .execute();
    // 4. Stays Table
    await db.schema
        .createTable('stays')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('resident_id', 'uuid', (col) => col.notNull())
        .addColumn('admission_date', 'date', (col) => col.notNull().defaultTo((0, kysely_1.sql) `CURRENT_DATE`))
        .addColumn('expected_checkout_date', 'date')
        .addColumn('actual_checkout_date', 'date')
        .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
        .addColumn('notes', 'text')
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addForeignKeyConstraint('fk_stays_resident_org', ['resident_id', 'organization_id'], 'residents', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addUniqueConstraint('unique_stay_id_org', ['id', 'organization_id'])
        .addCheckConstraint('check_stays_status', (0, kysely_1.sql) `status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')`)
        .addCheckConstraint('check_stays_expected_checkout', (0, kysely_1.sql) `expected_checkout_date IS NULL OR expected_checkout_date >= admission_date`)
        .addCheckConstraint('check_stays_actual_checkout', (0, kysely_1.sql) `actual_checkout_date IS NULL OR actual_checkout_date >= admission_date`)
        .addCheckConstraint('check_stays_status_checkout_nullability', (0, kysely_1.sql) `(status = 'ACTIVE' AND actual_checkout_date IS NULL) OR (status IN ('COMPLETED', 'CANCELLED') AND actual_checkout_date IS NOT NULL)`)
        .execute();
    // 5. Bed Allocations Table
    await db.schema
        .createTable('bed_allocations')
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo((0, kysely_1.sql) `gen_random_uuid()`))
        .addColumn('organization_id', 'uuid', (col) => col.notNull())
        .addColumn('stay_id', 'uuid', (col) => col.notNull())
        .addColumn('bed_id', 'uuid', (col) => col.notNull())
        .addColumn('start_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('end_at', 'timestamptz')
        .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
        .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo((0, kysely_1.sql) `NOW()`))
        .addForeignKeyConstraint('fk_allocations_stay_org', ['stay_id', 'organization_id'], 'stays', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addForeignKeyConstraint('fk_allocations_bed_org', ['bed_id', 'organization_id'], 'beds', ['id', 'organization_id'], (cb) => cb.onDelete('restrict'))
        .addCheckConstraint('check_allocations_status', (0, kysely_1.sql) `status IN ('ACTIVE', 'ENDED', 'CANCELLED')`)
        .addCheckConstraint('check_allocations_dates', (0, kysely_1.sql) `end_at IS NULL OR end_at >= start_at`)
        .addCheckConstraint('check_allocations_status_end_nullability', (0, kysely_1.sql) `(status = 'ACTIVE' AND end_at IS NULL) OR (status IN ('ENDED', 'CANCELLED') AND end_at IS NOT NULL)`)
        .execute();
    // 6. Partial Unique Indexes
    await (0, kysely_1.sql) `
    CREATE UNIQUE INDEX idx_unique_primary_emergency_contact 
    ON emergency_contacts (resident_id, organization_id) 
    WHERE is_primary = true
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE UNIQUE INDEX idx_unique_active_stay_per_resident 
    ON stays (resident_id) 
    WHERE status = 'ACTIVE'
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE UNIQUE INDEX idx_unique_active_allocation_per_bed 
    ON bed_allocations (bed_id) 
    WHERE status = 'ACTIVE'
  `.execute(db);
    // 7. Performance & Query Optimization Indexes
    await db.schema
        .createIndex('idx_residents_org_status_created')
        .on('residents')
        .columns(['organization_id', 'status', 'created_at'])
        .execute();
    await db.schema
        .createIndex('idx_stays_resident_history')
        .on('stays')
        .columns(['organization_id', 'resident_id', 'admission_date'])
        .execute();
    await db.schema
        .createIndex('idx_allocations_stay_status')
        .on('bed_allocations')
        .columns(['organization_id', 'stay_id', 'status'])
        .execute();
    await db.schema
        .createIndex('idx_allocations_history')
        .on('bed_allocations')
        .columns(['organization_id', 'stay_id', 'start_at'])
        .execute();
    await db.schema
        .createIndex('idx_emergency_contacts_resident')
        .on('emergency_contacts')
        .columns(['organization_id', 'resident_id', 'is_primary'])
        .execute();
}
async function down(db) {
    await db.schema.dropTable('bed_allocations').ifExists().execute();
    await db.schema.dropTable('stays').ifExists().execute();
    await db.schema.dropTable('emergency_contacts').ifExists().execute();
    await db.schema.dropTable('residents').ifExists().execute();
    await db.schema.dropTable('organization_counters').ifExists().execute();
}
//# sourceMappingURL=00004_resident_allocation_schema.js.map