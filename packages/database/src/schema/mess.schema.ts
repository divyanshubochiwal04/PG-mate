import type { ColumnType, Generated, Selectable } from 'kysely';

export type MessScopeType = 'CENTRAL' | 'PER_BLOCK';
export type MessBillingMode = 'PER_MEAL' | 'MONTHLY' | 'HYBRID';
export type MessSubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED' | 'SUPERSEDED';
export type MessConsumptionStatus = 'CONSUMED' | 'SKIPPED' | 'CANCELLED';
export type MessInventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type MessTransactionType =
  'OPENING_STOCK' | 'PURCHASE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'CONSUMPTION' | 'WASTAGE';
export type MessVendorStatus = 'ACTIVE' | 'INACTIVE';
export type MessExpenseCategory =
  'GAS' | 'ELECTRICITY' | 'SALARY' | 'CLEANING' | 'TRANSPORT' | 'MAINTENANCE' | 'MISCELLANEOUS';

export interface MessConfigurationsTable {
  id: Generated<string>;
  organization_id: string;
  is_enabled: boolean;
  scope_type: MessScopeType;
  billing_mode: MessBillingMode;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export interface MessesTable {
  id: Generated<string>;
  organization_id: string;
  name: string;
  code: string;
  scope_type: MessScopeType;
  is_active: boolean;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export interface MessBuildingAssignmentsTable {
  id: Generated<string>;
  organization_id: string;
  mess_id: string;
  building_id: string;
  is_active: boolean;
  created_at: ColumnType<Date, string | Date | undefined, never>;
}

export interface MessMealTypesTable {
  id: Generated<string>;
  organization_id: string;
  mess_id: string;
  name: string;
  start_time: string;
  end_time: string;
  display_order: number;
  is_active: boolean;
  created_at: ColumnType<Date, string | Date | undefined, never>;
}

export interface MessMealPlansTable {
  id: Generated<string>;
  organization_id: string;
  mess_id: string;
  name: string;
  description: string | null;
  billing_mode: 'PER_MEAL' | 'MONTHLY';
  price: ColumnType<number, number | string, number | string>;
  included_meal_types: string;
  version: number;
  is_active: boolean;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export interface MessMenusTable {
  id: Generated<string>;
  organization_id: string;
  mess_id: string;
  menu_date: ColumnType<string, string, string>;
  meal_type_id: string;
  notes: string | null;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export interface MessMenuItemsTable {
  id: Generated<string>;
  menu_id: string;
  item_name: string;
  category: string;
  display_order: number;
}

export interface ResidentMessSubscriptionsTable {
  id: Generated<string>;
  organization_id: string;
  resident_id: string;
  stay_id: string;
  mess_id: string;
  meal_plan_id: string;
  billing_mode: 'PER_MEAL' | 'MONTHLY';
  price_at_subscription: ColumnType<number, number | string, number | string>;
  status: MessSubscriptionStatus;
  start_date: ColumnType<string, string, string>;
  end_date: ColumnType<string | null, string | null, string | null>;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export interface MessMealConsumptionsTable {
  id: Generated<string>;
  organization_id: string;
  subscription_id: string;
  resident_id: string;
  stay_id: string;
  mess_id: string;
  meal_type_id: string;
  consumption_date: ColumnType<string, string, string>;
  status: MessConsumptionStatus;
  notes: string | null;
  created_at: ColumnType<Date, string | Date | undefined, never>;
}

export interface MessInventoryItemsTable {
  id: Generated<string>;
  organization_id: string;
  mess_id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: ColumnType<number, number | string, number | string>;
  minimum_stock: ColumnType<number, number | string, number | string>;
  reorder_level: ColumnType<number, number | string, number | string>;
  status: MessInventoryStatus;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export interface MessInventoryTransactionsTable {
  id: Generated<string>;
  organization_id: string;
  mess_id: string;
  inventory_item_id: string;
  transaction_type: MessTransactionType;
  quantity: ColumnType<number, number | string, number | string>;
  stock_before: ColumnType<number, number | string, number | string>;
  stock_after: ColumnType<number, number | string, number | string>;
  unit: string;
  procurement_id: string | null;
  notes: string | null;
  created_at: ColumnType<Date, string | Date | undefined, never>;
}

export interface MessVendorsTable {
  id: Generated<string>;
  organization_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: MessVendorStatus;
  notes: string | null;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export interface MessProcurementsTable {
  id: Generated<string>;
  organization_id: string;
  mess_id: string;
  vendor_id: string;
  purchase_date: ColumnType<string, string, string>;
  invoice_reference: string | null;
  total_amount: ColumnType<number, number | string, number | string>;
  notes: string | null;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export interface MessProcurementItemsTable {
  id: Generated<string>;
  procurement_id: string;
  inventory_item_id: string;
  quantity: ColumnType<number, number | string, number | string>;
  unit_price: ColumnType<number, number | string, number | string>;
  total_price: ColumnType<number, number | string, number | string>;
}

export interface MessExpensesTable {
  id: Generated<string>;
  organization_id: string;
  mess_id: string;
  category: MessExpenseCategory;
  amount: ColumnType<number, number | string, number | string>;
  expense_date: ColumnType<string, string, string>;
  vendor_id: string | null;
  reference_no: string | null;
  notes: string | null;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export type MessConfigurationRow = Selectable<MessConfigurationsTable>;
export type MessRow = Selectable<MessesTable>;
export type MessBuildingAssignmentRow = Selectable<MessBuildingAssignmentsTable>;
export type MessMealTypeRow = Selectable<MessMealTypesTable>;
export type MessMealPlanRow = Selectable<MessMealPlansTable>;
export type MessMenuRow = Selectable<MessMenusTable>;
export type MessMenuItemRow = Selectable<MessMenuItemsTable>;
export type ResidentMessSubscriptionRow = Selectable<ResidentMessSubscriptionsTable>;
export type MessMealConsumptionRow = Selectable<MessMealConsumptionsTable>;
export type MessInventoryItemRow = Selectable<MessInventoryItemsTable>;
export type MessInventoryTransactionRow = Selectable<MessInventoryTransactionsTable>;
export type MessVendorRow = Selectable<MessVendorsTable>;
export type MessProcurementRow = Selectable<MessProcurementsTable>;
export type MessProcurementItemRow = Selectable<MessProcurementItemsTable>;
export type MessExpenseRow = Selectable<MessExpensesTable>;
