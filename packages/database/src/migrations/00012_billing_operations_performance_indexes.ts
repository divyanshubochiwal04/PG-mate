import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS idx_invoices_org_resident
    ON invoices (organization_id, resident_id)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_payment_allocations_org_invoice
    ON payment_allocations (organization_id, invoice_id)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_payments_org_resident
    ON payments (organization_id, resident_id)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_payments_org_resident`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_payment_allocations_org_invoice`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_invoices_org_resident`.execute(db);
}
