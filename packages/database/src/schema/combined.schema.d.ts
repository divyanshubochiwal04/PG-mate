import type { AuthDatabaseSchema } from './auth.schema';
import type { TenantDatabaseSchema } from './tenant.schema';
import type { BedsTable, BuildingFacilitiesTable, BuildingsTable, FacilitiesTable, FloorsTable, PropertiesTable, PropertyFacilitiesTable, RoomFacilitiesTable, RoomsTable } from './inventory.schema';
import type { BedAllocationsTable, EmergencyContactsTable, OrganizationCountersTable, ResidentsTable, StaysTable } from './resident-allocation.schema';
export interface InventoryDatabaseSchema {
    properties: PropertiesTable;
    buildings: BuildingsTable;
    floors: FloorsTable;
    rooms: RoomsTable;
    beds: BedsTable;
    facilities: FacilitiesTable;
    property_facilities: PropertyFacilitiesTable;
    building_facilities: BuildingFacilitiesTable;
    room_facilities: RoomFacilitiesTable;
}
export interface ResidentDatabaseSchema {
    organization_counters: OrganizationCountersTable;
    residents: ResidentsTable;
    emergency_contacts: EmergencyContactsTable;
    stays: StaysTable;
    bed_allocations: BedAllocationsTable;
}
import type { ResidentAdditionalChargesTable, ResidentCommercialAgreementsTable, ResidentFacilitiesTable } from './commercial.schema';
import type { MessBuildingAssignmentsTable, MessConfigurationsTable, MessesTable, MessExpensesTable, MessInventoryItemsTable, MessInventoryTransactionsTable, MessMealConsumptionsTable, MessMealPlansTable, MessMealTypesTable, MessMenuItemsTable, MessMenusTable, MessProcurementItemsTable, MessProcurementsTable, MessVendorsTable, ResidentMessSubscriptionsTable } from './mess.schema';
export interface CommercialDatabaseSchema {
    resident_commercial_agreements: ResidentCommercialAgreementsTable;
    resident_facilities: ResidentFacilitiesTable;
    resident_additional_charges: ResidentAdditionalChargesTable;
}
export interface MessDatabaseSchema {
    mess_configurations: MessConfigurationsTable;
    messes: MessesTable;
    mess_building_assignments: MessBuildingAssignmentsTable;
    mess_meal_types: MessMealTypesTable;
    mess_meal_plans: MessMealPlansTable;
    mess_menus: MessMenusTable;
    mess_menu_items: MessMenuItemsTable;
    resident_mess_subscriptions: ResidentMessSubscriptionsTable;
    mess_meal_consumptions: MessMealConsumptionsTable;
    mess_inventory_items: MessInventoryItemsTable;
    mess_inventory_transactions: MessInventoryTransactionsTable;
    mess_vendors: MessVendorsTable;
    mess_procurements: MessProcurementsTable;
    mess_procurement_items: MessProcurementItemsTable;
    mess_expenses: MessExpensesTable;
}
import type { BillingConfigurationsTable, InvoiceItemsTable, InvoicesTable, PaymentAllocationsTable, PaymentsTable, ReceiptsTable } from './billing.schema';
import type { NotificationsTable } from './notification.schema';
import type { TaskActivitiesTable, TasksTable } from './task.schema';
export interface BillingDatabaseSchema {
    billing_configurations: BillingConfigurationsTable;
    invoices: InvoicesTable;
    invoice_items: InvoiceItemsTable;
    payments: PaymentsTable;
    payment_allocations: PaymentAllocationsTable;
    receipts: ReceiptsTable;
}
export interface NotificationDatabaseSchema {
    notifications: NotificationsTable;
}
export interface TaskDatabaseSchema {
    tasks: TasksTable;
    task_activities: TaskActivitiesTable;
}
export type DatabaseSchema = AuthDatabaseSchema & TenantDatabaseSchema & InventoryDatabaseSchema & ResidentDatabaseSchema & CommercialDatabaseSchema & MessDatabaseSchema & BillingDatabaseSchema & NotificationDatabaseSchema & TaskDatabaseSchema;
//# sourceMappingURL=combined.schema.d.ts.map