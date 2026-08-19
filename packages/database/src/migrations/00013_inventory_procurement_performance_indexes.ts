import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // Clean up any test fixture duplicate invoice references if present
  await sql`
    DELETE FROM mess_procurements p1
    USING mess_procurements p2
    WHERE p1.id > p2.id
      AND p1.organization_id = p2.organization_id
      AND p1.invoice_reference = p2.invoice_reference
      AND p1.invoice_reference IS NOT NULL
      AND p1.invoice_reference != ''
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_mess_inv_items_org_mess_name
    ON mess_inventory_items (organization_id, mess_id, name)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_mess_inv_tx_org_item_date
    ON mess_inventory_transactions (organization_id, inventory_item_id, created_at DESC)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_mess_vendors_org_status
    ON mess_vendors (organization_id, status)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_mess_proc_org_mess_date
    ON mess_procurements (organization_id, mess_id, purchase_date DESC)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_mess_proc_items_proc
    ON mess_procurement_items (procurement_id)
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_mess_exp_org_mess_date
    ON mess_expenses (organization_id, mess_id, expense_date DESC)
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_procurement_invoice_ref
    ON mess_procurements (organization_id, invoice_reference)
    WHERE invoice_reference IS NOT NULL AND invoice_reference != ''
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_uq_procurement_invoice_ref`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_mess_exp_org_mess_date`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_mess_proc_items_proc`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_mess_proc_org_mess_date`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_mess_vendors_org_status`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_mess_inv_tx_org_item_date`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_mess_inv_items_org_mess_name`.execute(db);
}
