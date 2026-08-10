import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Properties Table
  await db.schema
    .createTable('properties')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('restrict')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('code', 'varchar(50)', (col) => col.notNull())
    .addColumn('address_line1', 'varchar(255)', (col) => col.notNull())
    .addColumn('address_line2', 'varchar(255)')
    .addColumn('locality', 'varchar(100)', (col) => col.notNull())
    .addColumn('city', 'varchar(100)', (col) => col.notNull())
    .addColumn('state', 'varchar(100)', (col) => col.notNull())
    .addColumn('postal_code', 'varchar(20)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('uq_properties_id_org', ['id', 'organization_id'])
    .addUniqueConstraint('uq_properties_org_code', ['organization_id', 'code'])
    .execute();

  // 2. Buildings Table
  await db.schema
    .createTable('buildings')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('property_id', 'uuid', (col) => col.notNull())
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('code', 'varchar(50)', (col) => col.notNull())
    .addColumn('display_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('uq_buildings_id_org', ['id', 'organization_id'])
    .addUniqueConstraint('uq_buildings_property_code', ['property_id', 'code'])
    .addForeignKeyConstraint(
      'fk_buildings_property_org',
      ['property_id', 'organization_id'],
      'properties',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .execute();

  // 3. Floors Table
  await db.schema
    .createTable('floors')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('building_id', 'uuid', (col) => col.notNull())
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('floor_number', 'integer', (col) => col.notNull())
    .addColumn('display_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('uq_floors_id_org', ['id', 'organization_id'])
    .addUniqueConstraint('uq_floors_building_number', ['building_id', 'floor_number'])
    .addForeignKeyConstraint(
      'fk_floors_building_org',
      ['building_id', 'organization_id'],
      'buildings',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .execute();

  // 4. Rooms Table
  await db.schema
    .createTable('rooms')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('floor_id', 'uuid', (col) => col.notNull())
    .addColumn('building_id', 'uuid', (col) => col.notNull())
    .addColumn('property_id', 'uuid', (col) => col.notNull())
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('room_number', 'varchar(50)', (col) => col.notNull())
    .addColumn('room_type', 'varchar(50)', (col) => col.notNull().defaultTo('DOUBLE'))
    .addColumn('capacity', 'integer', (col) => col.notNull().check(sql`capacity >= 1`))
    .addColumn('display_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('uq_rooms_id_org', ['id', 'organization_id'])
    .addUniqueConstraint('uq_rooms_floor_number', ['floor_id', 'room_number'])
    .addForeignKeyConstraint(
      'fk_rooms_floor_org',
      ['floor_id', 'organization_id'],
      'floors',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addForeignKeyConstraint(
      'fk_rooms_building_org',
      ['building_id', 'organization_id'],
      'buildings',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addForeignKeyConstraint(
      'fk_rooms_property_org',
      ['property_id', 'organization_id'],
      'properties',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .execute();

  // 5. Beds Table
  await db.schema
    .createTable('beds')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('room_id', 'uuid', (col) => col.notNull())
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('bed_number', 'varchar(50)', (col) => col.notNull())
    .addColumn('display_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('AVAILABLE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('uq_beds_id_org', ['id', 'organization_id'])
    .addUniqueConstraint('uq_beds_room_number', ['room_id', 'bed_number'])
    .addForeignKeyConstraint(
      'fk_beds_room_org',
      ['room_id', 'organization_id'],
      'rooms',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .execute();

  // 6. Facilities Table
  await db.schema
    .createTable('facilities')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) =>
      col.notNull().references('organizations.id').onDelete('restrict')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('code', 'varchar(50)', (col) => col.notNull())
    .addColumn('category', 'varchar(50)', (col) => col.notNull().defaultTo('GENERAL'))
    .addColumn('description', 'text')
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('uq_facilities_id_org', ['id', 'organization_id'])
    .addUniqueConstraint('uq_facilities_org_code', ['organization_id', 'code'])
    .execute();

  // 7. Property Facilities Junction Table
  await db.schema
    .createTable('property_facilities')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('property_id', 'uuid', (col) => col.notNull())
    .addColumn('facility_id', 'uuid', (col) => col.notNull())
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('uq_property_facility', ['property_id', 'facility_id'])
    .addForeignKeyConstraint(
      'fk_prop_fac_property',
      ['property_id', 'organization_id'],
      'properties',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_prop_fac_facility',
      ['facility_id', 'organization_id'],
      'facilities',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .execute();

  // 8. Building Facilities Junction Table
  await db.schema
    .createTable('building_facilities')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('building_id', 'uuid', (col) => col.notNull())
    .addColumn('facility_id', 'uuid', (col) => col.notNull())
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('uq_building_facility', ['building_id', 'facility_id'])
    .addForeignKeyConstraint(
      'fk_bldg_fac_building',
      ['building_id', 'organization_id'],
      'buildings',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_bldg_fac_facility',
      ['facility_id', 'organization_id'],
      'facilities',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .execute();

  // 9. Room Facilities Junction Table
  await db.schema
    .createTable('room_facilities')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('room_id', 'uuid', (col) => col.notNull())
    .addColumn('facility_id', 'uuid', (col) => col.notNull())
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addUniqueConstraint('uq_room_facility', ['room_id', 'facility_id'])
    .addForeignKeyConstraint(
      'fk_room_fac_room',
      ['room_id', 'organization_id'],
      'rooms',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_room_fac_facility',
      ['facility_id', 'organization_id'],
      'facilities',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .execute();

  // 10. Indexes for fast query performance
  await db.schema
    .createIndex('idx_properties_org_created')
    .on('properties')
    .columns(['organization_id', 'created_at'])
    .execute();

  await db.schema
    .createIndex('idx_buildings_prop_order')
    .on('buildings')
    .columns(['property_id', 'display_order'])
    .execute();

  await db.schema
    .createIndex('idx_floors_bldg_number')
    .on('floors')
    .columns(['building_id', 'floor_number'])
    .execute();

  await db.schema
    .createIndex('idx_rooms_floor_order')
    .on('rooms')
    .columns(['floor_id', 'display_order'])
    .execute();

  await db.schema
    .createIndex('idx_beds_room_order')
    .on('beds')
    .columns(['room_id', 'display_order'])
    .execute();

  await db.schema
    .createIndex('idx_facilities_org_category')
    .on('facilities')
    .columns(['organization_id', 'category'])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('room_facilities').execute();
  await db.schema.dropTable('building_facilities').execute();
  await db.schema.dropTable('property_facilities').execute();
  await db.schema.dropTable('facilities').execute();
  await db.schema.dropTable('beds').execute();
  await db.schema.dropTable('rooms').execute();
  await db.schema.dropTable('floors').execute();
  await db.schema.dropTable('buildings').execute();
  await db.schema.dropTable('properties').execute();
}
