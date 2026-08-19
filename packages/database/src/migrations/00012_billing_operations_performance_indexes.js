"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS idx_invoices_org_resident
    ON invoices (organization_id, resident_id)
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS idx_payment_allocations_org_invoice
    ON payment_allocations (organization_id, invoice_id)
  `.execute(db);
    await (0, kysely_1.sql) `
    CREATE INDEX IF NOT EXISTS idx_payments_org_resident
    ON payments (organization_id, resident_id)
  `.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_payments_org_resident`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_payment_allocations_org_invoice`.execute(db);
    await (0, kysely_1.sql) `DROP INDEX IF EXISTS idx_invoices_org_resident`.execute(db);
}
//# sourceMappingURL=00012_billing_operations_performance_indexes.js.map