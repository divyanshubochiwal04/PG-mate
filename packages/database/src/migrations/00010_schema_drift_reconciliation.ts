import { type Kysely } from 'kysely';
import { reconcileCommercialSchema } from './helpers/reconcile-commercial';
import { reconcileMessSchema } from './helpers/reconcile-mess';

export async function up(db: Kysely<unknown>): Promise<void> {
  await reconcileCommercialSchema(db);
  await reconcileMessSchema(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
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
