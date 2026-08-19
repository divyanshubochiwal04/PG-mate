import { type Kysely, sql } from 'kysely';

export async function reconcileCommercialSchema(db: Kysely<unknown>): Promise<void> {
  // 1. Resident Commercial Agreements Table
  await db.schema
    .createTable('resident_commercial_agreements')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('resident_id', 'uuid', (col) => col.notNull())
    .addColumn('stay_id', 'uuid', (col) => col.notNull())
    .addColumn('base_rent_amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('security_deposit_amount', sql`numeric(12,2)`, (col) =>
      col.notNull().defaultTo(sql`0.00`)
    )
    .addColumn('security_deposit_status', 'varchar(30)', (col) =>
      col.notNull().defaultTo('PENDING')
    )
    .addColumn('billing_cycle', 'varchar(30)', (col) => col.notNull().defaultTo('JOINING_DATE'))
    .addColumn('effective_date', 'date', (col) => col.notNull().defaultTo(sql`CURRENT_DATE`))
    .addColumn('end_date', 'date')
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addForeignKeyConstraint(
      'fk_agreements_resident_org',
      ['resident_id', 'organization_id'],
      'residents',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addForeignKeyConstraint(
      'fk_agreements_stay_org',
      ['stay_id', 'organization_id'],
      'stays',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addCheckConstraint('check_agreements_base_rent', sql`base_rent_amount >= 0`)
    .addCheckConstraint('check_agreements_deposit', sql`security_deposit_amount >= 0`)
    .addCheckConstraint(
      'check_agreements_status',
      sql`status IN ('ACTIVE', 'SUPERSEDED', 'TERMINATED')`
    )
    .addCheckConstraint(
      'check_agreements_deposit_status',
      sql`security_deposit_status IN ('PENDING', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FORFEITED')`
    )
    .addCheckConstraint(
      'check_agreements_billing_cycle',
      sql`billing_cycle IN ('FIRST_OF_MONTH', 'JOINING_DATE')`
    )
    .addCheckConstraint(
      'check_agreements_end_date',
      sql`end_date IS NULL OR end_date >= effective_date`
    )
    .addCheckConstraint(
      'check_agreements_status_end_nullability',
      sql`(status = 'ACTIVE' AND end_date IS NULL) OR (status IN ('SUPERSEDED', 'TERMINATED') AND end_date IS NOT NULL)`
    )
    .execute();

  // 2. Resident Facilities Table
  await db.schema
    .createTable('resident_facilities')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('resident_id', 'uuid', (col) => col.notNull())
    .addColumn('stay_id', 'uuid', (col) => col.notNull())
    .addColumn('facility_id', 'uuid', (col) => col.notNull())
    .addColumn('facility_type', 'varchar(20)', (col) => col.notNull().defaultTo('INCLUDED'))
    .addColumn('monthly_charge', sql`numeric(12,2)`, (col) => col.notNull().defaultTo(sql`0.00`))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('effective_date', 'date', (col) => col.notNull().defaultTo(sql`CURRENT_DATE`))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addForeignKeyConstraint(
      'fk_res_fac_resident_org',
      ['resident_id', 'organization_id'],
      'residents',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_res_fac_stay_org',
      ['stay_id', 'organization_id'],
      'stays',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_res_fac_facility_org',
      ['facility_id', 'organization_id'],
      'facilities',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('restrict')
    )
    .addCheckConstraint(
      'check_res_fac_facility_type',
      sql`facility_type IN ('INCLUDED', 'PAID', 'OPTIONAL')`
    )
    .addCheckConstraint('check_res_fac_monthly_charge', sql`monthly_charge >= 0`)
    .addCheckConstraint('check_res_fac_status', sql`status IN ('ACTIVE', 'REVOKED')`)
    .execute();

  // 3. Resident Additional Charges Table
  await db.schema
    .createTable('resident_additional_charges')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('organization_id', 'uuid', (col) => col.notNull())
    .addColumn('resident_id', 'uuid', (col) => col.notNull())
    .addColumn('stay_id', 'uuid', (col) => col.notNull())
    .addColumn('agreement_id', 'uuid')
    .addColumn('charge_type', 'varchar(30)', (col) => col.notNull())
    .addColumn('description', 'varchar(255)', (col) => col.notNull())
    .addColumn('amount', sql`numeric(12,2)`, (col) => col.notNull())
    .addColumn('is_recurring', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('effective_date', 'date', (col) => col.notNull().defaultTo(sql`CURRENT_DATE`))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addForeignKeyConstraint(
      'fk_charges_resident_org',
      ['resident_id', 'organization_id'],
      'residents',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_charges_stay_org',
      ['stay_id', 'organization_id'],
      'stays',
      ['id', 'organization_id'],
      (cb) => cb.onDelete('cascade')
    )
    .addForeignKeyConstraint(
      'fk_charges_agreement',
      ['agreement_id'],
      'resident_commercial_agreements',
      ['id'],
      (cb) => cb.onDelete('set null')
    )
    .addCheckConstraint('check_charges_amount', sql`amount > 0`)
    .addCheckConstraint('check_charges_status', sql`status IN ('ACTIVE', 'CANCELLED')`)
    .addCheckConstraint(
      'check_charges_type',
      sql`charge_type IN ('MAINTENANCE', 'PARKING', 'EXTRA_FACILITY', 'ONE_TIME_FEE', 'CUSTOM')`
    )
    .execute();

  // M7.1 Indexes
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_commercial_per_stay 
    ON resident_commercial_agreements (stay_id) 
    WHERE status = 'ACTIVE'
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_res_facility 
    ON resident_facilities (stay_id, facility_id) 
    WHERE status = 'ACTIVE'
  `.execute(db);

  await db.schema
    .createIndex('idx_agreements_resident_stay')
    .ifNotExists()
    .on('resident_commercial_agreements')
    .columns(['organization_id', 'resident_id', 'stay_id', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_facilities_resident_stay')
    .ifNotExists()
    .on('resident_facilities')
    .columns(['organization_id', 'resident_id', 'stay_id', 'status'])
    .execute();

  await db.schema
    .createIndex('idx_charges_resident_stay')
    .ifNotExists()
    .on('resident_additional_charges')
    .columns(['organization_id', 'resident_id', 'stay_id', 'status'])
    .execute();
}
