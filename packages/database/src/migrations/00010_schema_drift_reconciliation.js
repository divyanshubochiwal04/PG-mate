"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const reconcile_commercial_1 = require("./helpers/reconcile-commercial");
const reconcile_mess_1 = require("./helpers/reconcile-mess");
async function up(db) {
    await (0, reconcile_commercial_1.reconcileCommercialSchema)(db);
    await (0, reconcile_mess_1.reconcileMessSchema)(db);
}
async function down(db) {
    // Safe rollback if required
    await db.schema.dropTable('mess_expenses').ifExists().execute();
    await db.schema.dropTable('mess_procurement_items').ifExists().execute();
    await db.schema.dropTable('mess_procurements').ifExists().execute();
    await db.schema.dropTable('mess_vendors').ifExists().execute();
    await db.schema.dropTable('mess_inventory_transactions').ifExists().execute();
    await db.schema.dropTable('mess_inventory_items').ifExists().execute();
    await db.schema.dropTable('mess_meal_consumptions').ifExists().execute();
    await db.schema.dropTable('resident_mess_subscriptions').ifExists().execute();
    await db.schema.dropTable('mess_menu_items').ifExists().execute();
    await db.schema.dropTable('mess_menus').ifExists().execute();
    await db.schema.dropTable('mess_meal_plans').ifExists().execute();
    await db.schema.dropTable('mess_meal_types').ifExists().execute();
    await db.schema.dropTable('mess_building_assignments').ifExists().execute();
    await db.schema.dropTable('messes').ifExists().execute();
    await db.schema.dropTable('mess_configurations').ifExists().execute();
    await db.schema.dropTable('resident_additional_charges').ifExists().execute();
    await db.schema.dropTable('resident_facilities').ifExists().execute();
    await db.schema.dropTable('resident_commercial_agreements').ifExists().execute();
}
//# sourceMappingURL=00010_schema_drift_reconciliation.js.map