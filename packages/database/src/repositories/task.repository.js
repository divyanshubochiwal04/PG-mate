"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyTaskRepository = void 0;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUuid(id) {
    if (!id)
        return false;
    return UUID_REGEX.test(id);
}
class KyselyTaskRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async createForOrganization(organizationId, data, trx) {
        const client = trx || this.db;
        return client
            .insertInto('tasks')
            .values({
            ...data,
            organization_id: organizationId,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async createIfNotExistsForNotification(organizationId, data, trx) {
        const client = trx || this.db;
        if (data.notification_id && isValidUuid(data.notification_id) && isValidUuid(organizationId)) {
            const existing = await client
                .selectFrom('tasks')
                .selectAll()
                .where('organization_id', '=', organizationId)
                .where('notification_id', '=', data.notification_id)
                .where('status', '!=', 'CANCELLED')
                .executeTakeFirst();
            if (existing) {
                return existing;
            }
        }
        return this.createForOrganization(organizationId, data, trx);
    }
    async findById(id, organizationId) {
        if (!isValidUuid(id) || !isValidUuid(organizationId))
            return null;
        const task = await this.db
            .selectFrom('tasks')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return task || null;
    }
    async findByIdForUpdate(id, organizationId, trx) {
        if (!isValidUuid(id) || !isValidUuid(organizationId))
            return null;
        const task = await trx
            .selectFrom('tasks')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .forUpdate()
            .executeTakeFirst();
        return task || null;
    }
    async updateForOrganization(id, organizationId, updates, trx) {
        if (!isValidUuid(id) || !isValidUuid(organizationId))
            return null;
        const client = trx || this.db;
        const updated = await client
            .updateTable('tasks')
            .set({
            ...updates,
            updated_at: new Date(),
        })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return updated || null;
    }
    async list(organizationId, query) {
        if (!isValidUuid(organizationId)) {
            return { data: [], total: 0, page: query.page || 1, pageSize: query.pageSize || 20, totalPages: 0 };
        }
        let qb = this.db.selectFrom('tasks').selectAll().where('organization_id', '=', organizationId);
        if (query.search) {
            const searchPattern = `%${query.search.trim()}%`;
            qb = qb.where((eb) => eb.or([
                eb('title', 'ilike', searchPattern),
                eb('description', 'ilike', searchPattern),
            ]));
        }
        if (query.status) {
            qb = qb.where('status', '=', query.status);
        }
        if (query.priority) {
            qb = qb.where('priority', '=', query.priority);
        }
        if (query.assignedToUserId && isValidUuid(query.assignedToUserId)) {
            qb = qb.where('assigned_to_user_id', '=', query.assignedToUserId);
        }
        if (query.residentId && isValidUuid(query.residentId)) {
            qb = qb.where('resident_id', '=', query.residentId);
        }
        if (query.dueFrom) {
            qb = qb.where('due_date', '>=', new Date(query.dueFrom));
        }
        if (query.dueTo) {
            qb = qb.where('due_date', '<=', new Date(query.dueTo));
        }
        if (query.overdue) {
            qb = qb.where('due_date', '<', new Date()).where('status', 'in', ['TODO', 'IN_PROGRESS']);
        }
        const page = Math.max(1, query.page || 1);
        const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
        const offset = (page - 1) * pageSize;
        const countQuery = this.db
            .selectFrom('tasks')
            .select((eb) => eb.fn.count('id').as('cnt'))
            .where('organization_id', '=', organizationId);
        // Apply same filters to countQuery
        let cq = countQuery;
        if (query.search) {
            const searchPattern = `%${query.search.trim()}%`;
            cq = cq.where((eb) => eb.or([
                eb('title', 'ilike', searchPattern),
                eb('description', 'ilike', searchPattern),
            ]));
        }
        if (query.status)
            cq = cq.where('status', '=', query.status);
        if (query.priority)
            cq = cq.where('priority', '=', query.priority);
        if (query.assignedToUserId && isValidUuid(query.assignedToUserId))
            cq = cq.where('assigned_to_user_id', '=', query.assignedToUserId);
        if (query.residentId && isValidUuid(query.residentId))
            cq = cq.where('resident_id', '=', query.residentId);
        if (query.dueFrom)
            cq = cq.where('due_date', '>=', new Date(query.dueFrom));
        if (query.dueTo)
            cq = cq.where('due_date', '<=', new Date(query.dueTo));
        if (query.overdue)
            cq = cq.where('due_date', '<', new Date()).where('status', 'in', ['TODO', 'IN_PROGRESS']);
        const [data, totalRes] = await Promise.all([
            qb.orderBy('created_at', 'desc').limit(pageSize).offset(offset).execute(),
            cq.executeTakeFirst(),
        ]);
        const total = Number(totalRes?.cnt || 0);
        const totalPages = Math.ceil(total / pageSize);
        return { data, total, page, pageSize, totalPages };
    }
    async getSummary(organizationId, userId) {
        if (!isValidUuid(organizationId)) {
            return {
                totalTasks: 0,
                todoTasks: 0,
                inProgressTasks: 0,
                completedTasks: 0,
                cancelledTasks: 0,
                overdueTasks: 0,
                criticalTasks: 0,
                myPendingTasks: 0,
            };
        }
        const now = new Date();
        const rows = await this.db
            .selectFrom('tasks')
            .select(['status', 'priority', 'due_date', 'assigned_to_user_id'])
            .where('organization_id', '=', organizationId)
            .execute();
        let totalTasks = 0;
        let todoTasks = 0;
        let inProgressTasks = 0;
        let completedTasks = 0;
        let cancelledTasks = 0;
        let overdueTasks = 0;
        let criticalTasks = 0;
        let myPendingTasks = 0;
        for (const r of rows) {
            totalTasks++;
            if (r.status === 'TODO')
                todoTasks++;
            else if (r.status === 'IN_PROGRESS')
                inProgressTasks++;
            else if (r.status === 'COMPLETED')
                completedTasks++;
            else if (r.status === 'CANCELLED')
                cancelledTasks++;
            if (r.priority === 'CRITICAL' && r.status !== 'COMPLETED' && r.status !== 'CANCELLED') {
                criticalTasks++;
            }
            if (r.due_date &&
                new Date(r.due_date) < now &&
                (r.status === 'TODO' || r.status === 'IN_PROGRESS')) {
                overdueTasks++;
            }
            if (userId &&
                isValidUuid(userId) &&
                r.assigned_to_user_id === userId &&
                (r.status === 'TODO' || r.status === 'IN_PROGRESS')) {
                myPendingTasks++;
            }
        }
        return {
            totalTasks,
            todoTasks,
            inProgressTasks,
            completedTasks,
            cancelledTasks,
            overdueTasks,
            criticalTasks,
            myPendingTasks,
        };
    }
    async findTasksForResident(residentId, organizationId) {
        if (!isValidUuid(residentId) || !isValidUuid(organizationId))
            return [];
        return this.db
            .selectFrom('tasks')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('resident_id', '=', residentId)
            .orderBy('created_at', 'desc')
            .execute();
    }
    async findTasksForNotification(notificationId, organizationId) {
        if (!isValidUuid(notificationId) || !isValidUuid(organizationId))
            return null;
        const task = await this.db
            .selectFrom('tasks')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('notification_id', '=', notificationId)
            .where('status', '!=', 'CANCELLED')
            .executeTakeFirst();
        return task || null;
    }
    async createActivity(data, trx) {
        const client = trx || this.db;
        return client.insertInto('task_activities').values(data).returningAll().executeTakeFirstOrThrow();
    }
    async getActivitiesForTask(taskId, organizationId) {
        if (!isValidUuid(taskId) || !isValidUuid(organizationId))
            return [];
        return this.db
            .selectFrom('task_activities')
            .selectAll()
            .where('task_id', '=', taskId)
            .where('organization_id', '=', organizationId)
            .orderBy('created_at', 'desc')
            .execute();
    }
}
exports.KyselyTaskRepository = KyselyTaskRepository;
//# sourceMappingURL=task.repository.js.map