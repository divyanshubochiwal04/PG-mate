import { type Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type {
  MessBuildingAssignmentRow,
  MessConfigurationRow,
  MessExpenseRow,
  MessInventoryItemRow,
  MessInventoryTransactionRow,
  MessMealConsumptionRow,
  MessMealPlanRow,
  MessMealTypeRow,
  MessMenuItemRow,
  MessMenuRow,
  MessProcurementItemRow,
  MessProcurementRow,
  MessRow,
  MessVendorRow,
  ResidentMessSubscriptionRow,
} from '../schema/mess.schema';

export interface MessRepository {
  getConfig(
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessConfigurationRow | null>;
  upsertConfig(
    organizationId: string,
    data: {
      isEnabled?: boolean;
      scopeType?: 'CENTRAL' | 'PER_BLOCK';
      billingMode?: 'PER_MEAL' | 'MONTHLY' | 'HYBRID';
    },
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessConfigurationRow>;
  listMesses(organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<MessRow[]>;
  findMessById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessRow | null>;
  createMess(
    mess: Omit<MessRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessRow>;
  assignBuildings(
    organizationId: string,
    messId: string,
    buildingIds: string[],
    trx?: Transaction<DatabaseSchema>
  ): Promise<void>;
  getBuildingAssignments(
    organizationId: string,
    messId: string
  ): Promise<MessBuildingAssignmentRow[]>;
  listMealTypes(
    organizationId: string,
    messId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealTypeRow[]>;
  createMealType(
    mealType: Omit<MessMealTypeRow, 'id' | 'created_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealTypeRow>;
  listMealPlans(
    organizationId: string,
    messId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealPlanRow[]>;
  findMealPlanById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealPlanRow | null>;
  createMealPlan(
    plan: Omit<MessMealPlanRow, 'id' | 'created_at' | 'updated_at' | 'version' | 'description'> & {
      version?: number;
      description?: string | null;
    },
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealPlanRow>;
  findMenuByDate(
    organizationId: string,
    messId: string,
    date: string,
    mealTypeId: string
  ): Promise<(MessMenuRow & { items: MessMenuItemRow[] }) | null>;
  upsertMenu(
    organizationId: string,
    menuData: Omit<MessMenuRow, 'id' | 'created_at' | 'updated_at'>,
    items: Omit<MessMenuItemRow, 'id' | 'menu_id'>[],
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMenuRow>;
  findActiveSubscriptionByStay(
    organizationId: string,
    stayId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentMessSubscriptionRow | null>;
  createSubscription(
    sub: Omit<ResidentMessSubscriptionRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<ResidentMessSubscriptionRow>;
  endActiveSubscription(
    organizationId: string,
    stayId: string,
    endDate: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<void>;
  recordConsumption(
    cons: Omit<MessMealConsumptionRow, 'id' | 'created_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessMealConsumptionRow>;
  findConsumptionsByDate(
    organizationId: string,
    messId: string,
    date: string
  ): Promise<MessMealConsumptionRow[]>;
  getTodayConsumptionMetrics(
    organizationId: string,
    messId: string,
    date: string
  ): Promise<{ expected: number; consumed: number; skipped: number }>;
  listInventoryItems(
    organizationId: string,
    messId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: MessInventoryItemRow[]; total: number }>;
  findInventoryItemByIdForUpdate(
    id: string,
    organizationId: string,
    trx: Transaction<DatabaseSchema>
  ): Promise<MessInventoryItemRow | null>;
  createInventoryItem(
    item: Omit<MessInventoryItemRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessInventoryItemRow>;
  recordInventoryTransaction(
    txData: Omit<MessInventoryTransactionRow, 'id' | 'created_at'>,
    trx: Transaction<DatabaseSchema>
  ): Promise<MessInventoryTransactionRow>;
  updateItemStock(
    id: string,
    organizationId: string,
    currentStock: number,
    status: MessInventoryItemRow['status'],
    trx: Transaction<DatabaseSchema>
  ): Promise<void>;
  listVendors(
    organizationId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: MessVendorRow[]; total: number }>;
  createVendor(
    vendor: Omit<MessVendorRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessVendorRow>;
  listProcurements(
    organizationId: string,
    messId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: MessProcurementRow[]; total: number }>;
  createProcurement(
    procData: Omit<MessProcurementRow, 'id' | 'created_at' | 'updated_at'>,
    itemData: Omit<MessProcurementItemRow, 'id' | 'procurement_id'>[],
    trx: Transaction<DatabaseSchema>
  ): Promise<MessProcurementRow>;
  listExpenses(
    organizationId: string,
    messId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: MessExpenseRow[]; total: number }>;
  createExpense(
    exp: Omit<MessExpenseRow, 'id' | 'created_at' | 'updated_at'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<MessExpenseRow>;
}
