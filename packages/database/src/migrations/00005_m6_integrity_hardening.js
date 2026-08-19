"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `
    CREATE UNIQUE INDEX idx_unique_active_allocation_per_stay
    ON bed_allocations (stay_id)
    WHERE status = 'ACTIVE'
  `.execute(db);
}
async function down(db) {
    await db.schema.dropIndex('idx_unique_active_allocation_per_stay').ifExists().execute();
}
//# sourceMappingURL=00005_m6_integrity_hardening.js.map