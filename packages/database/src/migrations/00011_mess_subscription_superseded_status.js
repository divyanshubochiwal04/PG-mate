"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const kysely_1 = require("kysely");
async function up(db) {
    await (0, kysely_1.sql) `
    ALTER TABLE resident_mess_subscriptions 
    DROP CONSTRAINT IF EXISTS check_subs_status
  `.execute(db);
    await (0, kysely_1.sql) `
    ALTER TABLE resident_mess_subscriptions 
    ADD CONSTRAINT check_subs_status 
    CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED', 'SUPERSEDED'))
  `.execute(db);
}
async function down(db) {
    await (0, kysely_1.sql) `
    ALTER TABLE resident_mess_subscriptions 
    DROP CONSTRAINT IF EXISTS check_subs_status
  `.execute(db);
    await (0, kysely_1.sql) `
    ALTER TABLE resident_mess_subscriptions 
    ADD CONSTRAINT check_subs_status 
    CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED'))
  `.execute(db);
}
//# sourceMappingURL=00011_mess_subscription_superseded_status.js.map