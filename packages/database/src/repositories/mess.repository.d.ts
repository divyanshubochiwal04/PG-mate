import { type Kysely, type Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type { MessBuildingAssignmentRow, MessConfigurationRow, MessMealConsumptionRow, MessMealPlanRow, MessMealTypeRow, MessMenuItemRow, MessMenuRow, MessRow, ResidentMessSubscriptionRow } from '../schema/mess.schema';
export type { MessRepository } from './mess-repository.interface';
import type { MessRepository } from './mess-repository.interface';
import { KyselyMessInventoryRepository } from './mess-inventory.repository';
export declare class KyselyMessRepository extends KyselyMessInventoryRepository implements MessRepository {
    constructor(db: Kysely<DatabaseSchema>);
    protected getExecutor(trx?: Transaction<DatabaseSchema>): Kysely<DatabaseSchema>;
    getConfig(organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<MessConfigurationRow | null>;
    upsertConfig(organizationId: string, data: {
        isEnabled?: boolean;
        scopeType?: 'CENTRAL' | 'PER_BLOCK';
        billingMode?: 'PER_MEAL' | 'MONTHLY' | 'HYBRID';
    }, trx?: Transaction<DatabaseSchema>): Promise<MessConfigurationRow>;
    listMesses(organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<MessRow[]>;
    findMessById(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<MessRow | null>;
    createMess(mess: Omit<MessRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<MessRow>;
    assignBuildings(organizationId: string, messId: string, buildingIds: string[], trx?: Transaction<DatabaseSchema>): Promise<void>;
    getBuildingAssignments(organizationId: string, messId: string): Promise<MessBuildingAssignmentRow[]>;
    listMealTypes(organizationId: string, messId: string, trx?: Transaction<DatabaseSchema>): Promise<MessMealTypeRow[]>;
    createMealType(mealType: Omit<MessMealTypeRow, 'id' | 'created_at'>, trx?: Transaction<DatabaseSchema>): Promise<MessMealTypeRow>;
    listMealPlans(organizationId: string, messId: string, trx?: Transaction<DatabaseSchema>): Promise<MessMealPlanRow[]>;
    findMealPlanById(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<MessMealPlanRow | null>;
    createMealPlan(plan: Omit<MessMealPlanRow, 'id' | 'created_at' | 'updated_at' | 'version' | 'description'> & {
        version?: number;
        description?: string | null;
    }, trx?: Transaction<DatabaseSchema>): Promise<MessMealPlanRow>;
    findMenuByDate(organizationId: string, messId: string, date: string, mealTypeId: string): Promise<(MessMenuRow & {
        items: MessMenuItemRow[];
    }) | null>;
    upsertMenu(organizationId: string, menuData: Omit<MessMenuRow, 'id' | 'created_at' | 'updated_at'>, items: Omit<MessMenuItemRow, 'id' | 'menu_id'>[], trx?: Transaction<DatabaseSchema>): Promise<MessMenuRow>;
    findSubscriptionById(organizationId: string, id: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentMessSubscriptionRow | null>;
    findActiveSubscriptionByStay(organizationId: string, stayId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentMessSubscriptionRow | null>;
    findActiveSubscriptionByResident(organizationId: string, residentId: string, trx?: Transaction<DatabaseSchema>): Promise<ResidentMessSubscriptionRow | null>;
    createSubscription(sub: Omit<ResidentMessSubscriptionRow, 'id' | 'created_at' | 'updated_at'>, trx?: Transaction<DatabaseSchema>): Promise<ResidentMessSubscriptionRow>;
    supersedeActiveSubscription(organizationId: string, stayId: string, endDate: string, trx?: Transaction<DatabaseSchema>): Promise<void>;
    cancelActiveSubscription(organizationId: string, stayId: string, endDate: string, trx?: Transaction<DatabaseSchema>): Promise<void>;
    endActiveSubscription(organizationId: string, stayId: string, endDate: string, trx?: Transaction<DatabaseSchema>): Promise<void>;
    recordConsumption(cons: Omit<MessMealConsumptionRow, 'id' | 'created_at'>, trx?: Transaction<DatabaseSchema>): Promise<MessMealConsumptionRow>;
    findConsumptionsByDate(organizationId: string, messId: string, date: string): Promise<MessMealConsumptionRow[]>;
    getTodayConsumptionMetrics(organizationId: string, messId: string, date: string): Promise<{
        expected: number;
        consumed: number;
        skipped: number;
    }>;
}
//# sourceMappingURL=mess.repository.d.ts.map