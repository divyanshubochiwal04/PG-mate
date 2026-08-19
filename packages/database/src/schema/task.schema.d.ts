import type { ColumnType, Generated, Selectable, Insertable, Updateable } from 'kysely';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskActivityAction = 'CREATED' | 'UPDATED' | 'ASSIGNED' | 'UNASSIGNED' | 'STARTED' | 'COMPLETED' | 'CANCELLED' | 'REOPENED';
export interface TasksTable {
    id: Generated<string>;
    organization_id: string;
    title: string;
    description: string | null;
    status: ColumnType<TaskStatus, TaskStatus | undefined, TaskStatus>;
    priority: ColumnType<TaskPriority, TaskPriority | undefined, TaskPriority>;
    due_date: ColumnType<Date | null, string | Date | null, string | Date | null>;
    completed_at: ColumnType<Date | null, string | Date | null, string | Date | null>;
    cancelled_at: ColumnType<Date | null, string | Date | null, string | Date | null>;
    assigned_to_user_id: string | null;
    created_by_user_id: string;
    resident_id: string | null;
    invoice_id: string | null;
    payment_id: string | null;
    inventory_item_id: string | null;
    procurement_id: string | null;
    expense_id: string | null;
    notification_id: string | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export type TaskRow = Selectable<TasksTable>;
export type NewTaskRow = Insertable<TasksTable>;
export type TaskRowUpdate = Updateable<TasksTable>;
export interface TaskActivitiesTable {
    id: Generated<string>;
    task_id: string;
    organization_id: string;
    action: TaskActivityAction;
    previous_status: TaskStatus | null;
    new_status: TaskStatus | null;
    performed_by_user_id: string;
    note: string | null;
    created_at: Generated<Date>;
}
export type TaskActivityRow = Selectable<TaskActivitiesTable>;
export type NewTaskActivityRow = Insertable<TaskActivitiesTable>;
//# sourceMappingURL=task.schema.d.ts.map