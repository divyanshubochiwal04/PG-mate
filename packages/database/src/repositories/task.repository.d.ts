import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';
import type { NewTaskActivityRow, NewTaskRow, TaskActivityRow, TaskRow, TaskRowUpdate } from '../schema/task.schema';
import type { TaskQueryDto, TaskSummaryDto } from '@m-square/contracts';
export declare class KyselyTaskRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    createForOrganization(organizationId: string, data: Omit<NewTaskRow, 'organization_id'>, trx?: Transaction<DatabaseSchema>): Promise<TaskRow>;
    createIfNotExistsForNotification(organizationId: string, data: Omit<NewTaskRow, 'organization_id'>, trx?: Transaction<DatabaseSchema>): Promise<TaskRow>;
    findById(id: string, organizationId: string): Promise<TaskRow | null>;
    findByIdForUpdate(id: string, organizationId: string, trx: Transaction<DatabaseSchema>): Promise<TaskRow | null>;
    updateForOrganization(id: string, organizationId: string, updates: TaskRowUpdate, trx?: Transaction<DatabaseSchema>): Promise<TaskRow | null>;
    list(organizationId: string, query: TaskQueryDto): Promise<{
        data: TaskRow[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getSummary(organizationId: string, userId?: string): Promise<TaskSummaryDto>;
    findTasksForResident(residentId: string, organizationId: string): Promise<TaskRow[]>;
    findTasksForNotification(notificationId: string, organizationId: string): Promise<TaskRow | null>;
    createActivity(data: NewTaskActivityRow, trx?: Transaction<DatabaseSchema>): Promise<TaskActivityRow>;
    getActivitiesForTask(taskId: string, organizationId: string): Promise<TaskActivityRow[]>;
}
//# sourceMappingURL=task.repository.d.ts.map