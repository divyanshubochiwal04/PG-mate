import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Target Unique Constraints for Composite FKs
  await sql`ALTER TABLE invoices ADD CONSTRAINT unique_invoice_id_org UNIQUE (id, organization_id)`.execute(
    db
  );
  await sql`ALTER TABLE payments ADD CONSTRAINT unique_payment_id_org UNIQUE (id, organization_id)`.execute(
    db
  );

  // 2. Invoices Composite Tenant FKs
  await sql`
    ALTER TABLE invoices
    ADD CONSTRAINT fk_invoices_stay_org
    FOREIGN KEY (stay_id, organization_id)
    REFERENCES stays (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  await sql`
    ALTER TABLE invoices
    ADD CONSTRAINT fk_invoices_resident_org
    FOREIGN KEY (resident_id, organization_id)
    REFERENCES residents (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  // 3. Invoice Items Composite Tenant FK
  await sql`
    ALTER TABLE invoice_items
    ADD CONSTRAINT fk_invoice_items_invoice_org
    FOREIGN KEY (invoice_id, organization_id)
    REFERENCES invoices (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  // 4. Payments Composite Tenant FKs
  await sql`
    ALTER TABLE payments
    ADD CONSTRAINT fk_payments_stay_org
    FOREIGN KEY (stay_id, organization_id)
    REFERENCES stays (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  await sql`
    ALTER TABLE payments
    ADD CONSTRAINT fk_payments_resident_org
    FOREIGN KEY (resident_id, organization_id)
    REFERENCES residents (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  // 5. Payment Allocations Composite Tenant FKs
  await sql`
    ALTER TABLE payment_allocations
    ADD CONSTRAINT fk_payment_allocations_payment_org
    FOREIGN KEY (payment_id, organization_id)
    REFERENCES payments (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  await sql`
    ALTER TABLE payment_allocations
    ADD CONSTRAINT fk_payment_allocations_invoice_org
    FOREIGN KEY (invoice_id, organization_id)
    REFERENCES invoices (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  // 6. Receipts Composite Tenant FKs & Check Constraint
  await sql`
    ALTER TABLE receipts
    ADD CONSTRAINT fk_receipts_payment_org
    FOREIGN KEY (payment_id, organization_id)
    REFERENCES payments (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  await sql`
    ALTER TABLE receipts
    ADD CONSTRAINT fk_receipts_stay_org
    FOREIGN KEY (stay_id, organization_id)
    REFERENCES stays (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  await sql`
    ALTER TABLE receipts
    ADD CONSTRAINT fk_receipts_resident_org
    FOREIGN KEY (resident_id, organization_id)
    REFERENCES residents (id, organization_id)
    ON DELETE CASCADE
  `.execute(db);

  await sql`
    ALTER TABLE receipts
    ADD CONSTRAINT check_receipt_amount_pos
    CHECK (amount > 0)
  `.execute(db);

  // 7. Partial Unique Index for Billing Period Protection
  await sql`
    CREATE UNIQUE INDEX idx_uq_invoice_stay_period
    ON invoices (organization_id, stay_id, billing_period_start)
    WHERE status != 'CANCELLED'
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_uq_invoice_stay_period`.execute(db);

  await sql`ALTER TABLE receipts DROP CONSTRAINT IF EXISTS check_receipt_amount_pos`.execute(db);
  await sql`ALTER TABLE receipts DROP CONSTRAINT IF EXISTS fk_receipts_resident_org`.execute(db);
  await sql`ALTER TABLE receipts DROP CONSTRAINT IF EXISTS fk_receipts_stay_org`.execute(db);
  await sql`ALTER TABLE receipts DROP CONSTRAINT IF EXISTS fk_receipts_payment_org`.execute(db);

  await sql`ALTER TABLE payment_allocations DROP CONSTRAINT IF EXISTS fk_payment_allocations_invoice_org`.execute(
    db
  );
  await sql`ALTER TABLE payment_allocations DROP CONSTRAINT IF EXISTS fk_payment_allocations_payment_org`.execute(
    db
  );

  await sql`ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_resident_org`.execute(db);
  await sql`ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_stay_org`.execute(db);
  await sql`ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_payment_id_org`.execute(db);

  await sql`ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS fk_invoice_items_invoice_org`.execute(
    db
  );

  await sql`ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_resident_org`.execute(db);
  await sql`ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_stay_org`.execute(db);
  await sql`ALTER TABLE invoices DROP CONSTRAINT IF EXISTS unique_invoice_id_org`.execute(db);
}
