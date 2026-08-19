"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyNotificationRepository = void 0;
const kysely_1 = require("kysely");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(id) {
    return typeof id === 'string' && UUID_REGEX.test(id);
}
class KyselyNotificationRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    getExecutor(trx) {
        return trx && typeof trx.selectFrom === 'function'
            ? trx
            : this.db;
    }
    async create(organizationId, data, trx) {
        if (!isValidUuid(organizationId)) {
            return {
                id: crypto.randomUUID(),
                organization_id: organizationId,
                type: data.type,
                severity: data.severity || 'INFO',
                title: data.title,
                message: data.message,
                entity_type: data.entity_type || null,
                entity_id: data.entity_id || null,
                action_route: data.action_route || null,
                metadata: data.metadata || null,
                dedupe_key: data.dedupe_key || null,
                status: data.status || 'UNREAD',
                created_at: new Date(),
                read_at: data.read_at || null,
                resolved_at: data.resolved_at || null,
                expires_at: data.expires_at || null,
            };
        }
        const client = this.getExecutor(trx);
        return client
            .insertInto('notifications')
            .values({
            organization_id: organizationId,
            type: data.type,
            severity: data.severity || 'INFO',
            title: data.title,
            message: data.message,
            entity_type: data.entity_type || null,
            entity_id: data.entity_id || null,
            action_route: data.action_route || null,
            metadata: data.metadata || null,
            dedupe_key: data.dedupe_key || null,
            status: data.status || 'UNREAD',
            read_at: data.read_at || null,
            resolved_at: data.resolved_at || null,
            expires_at: data.expires_at || null,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
    }
    async findById(id, organizationId, trx) {
        if (!isValidUuid(organizationId) || !isValidUuid(id))
            return null;
        const client = this.getExecutor(trx);
        const row = await client
            .selectFrom('notifications')
            .selectAll()
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .executeTakeFirst();
        return row || null;
    }
    async findByOrganization(organizationId, query, trx) {
        const page = Math.max(1, query.page || 1);
        const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
        if (!isValidUuid(organizationId)) {
            return {
                data: [],
                total: 0,
                page,
                pageSize,
                totalPages: 0,
            };
        }
        const client = this.getExecutor(trx);
        let baseQuery = client
            .selectFrom('notifications')
            .where('organization_id', '=', organizationId);
        if (query.type) {
            baseQuery = baseQuery.where('type', '=', query.type);
        }
        if (query.severity) {
            baseQuery = baseQuery.where('severity', '=', query.severity);
        }
        if (query.status) {
            baseQuery = baseQuery.where('status', '=', query.status);
        }
        if (query.search) {
            const searchPattern = `%${query.search.trim()}%`;
            baseQuery = baseQuery.where((eb) => eb.or([
                eb('title', 'ilike', searchPattern),
                eb('message', 'ilike', searchPattern),
            ]));
        }
        if (query.fromDate) {
            baseQuery = baseQuery.where('created_at', '>=', new Date(query.fromDate));
        }
        if (query.toDate) {
            baseQuery = baseQuery.where('created_at', '<=', new Date(query.toDate));
        }
        const countResult = await baseQuery
            .select((0, kysely_1.sql) `count(*)::int`.as('total'))
            .executeTakeFirst();
        const total = countResult?.total || 0;
        const offset = (page - 1) * pageSize;
        const totalPages = Math.ceil(total / pageSize);
        const data = await baseQuery
            .selectAll()
            .orderBy('created_at', 'desc')
            .orderBy('id', 'desc')
            .limit(pageSize)
            .offset(offset)
            .execute();
        return {
            data,
            total,
            page,
            pageSize,
            totalPages,
        };
    }
    async countUnread(organizationId, trx) {
        if (!isValidUuid(organizationId))
            return 0;
        const client = this.getExecutor(trx);
        const result = await client
            .selectFrom('notifications')
            .select((0, kysely_1.sql) `count(*)::int`.as('count'))
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'UNREAD')
            .executeTakeFirst();
        return result?.count || 0;
    }
    async markRead(id, organizationId, trx) {
        if (!isValidUuid(organizationId) || !isValidUuid(id))
            return null;
        const client = this.getExecutor(trx);
        const row = await client
            .updateTable('notifications')
            .set({
            status: 'READ',
            read_at: (0, kysely_1.sql) `CURRENT_TIMESTAMP`,
        })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async markUnread(id, organizationId, trx) {
        if (!isValidUuid(organizationId) || !isValidUuid(id))
            return null;
        const client = this.getExecutor(trx);
        const row = await client
            .updateTable('notifications')
            .set({
            status: 'UNREAD',
            read_at: null,
        })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async markAllRead(organizationId, trx) {
        if (!isValidUuid(organizationId))
            return 0;
        const client = this.getExecutor(trx);
        const result = await client
            .updateTable('notifications')
            .set({
            status: 'READ',
            read_at: (0, kysely_1.sql) `CURRENT_TIMESTAMP`,
        })
            .where('organization_id', '=', organizationId)
            .where('status', '=', 'UNREAD')
            .execute();
        return Number(result[0]?.numUpdatedRows || 0);
    }
    async resolve(id, organizationId, trx) {
        if (!isValidUuid(organizationId) || !isValidUuid(id))
            return null;
        const client = this.getExecutor(trx);
        const row = await client
            .updateTable('notifications')
            .set({
            status: 'RESOLVED',
            resolved_at: (0, kysely_1.sql) `CURRENT_TIMESTAMP`,
        })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async dismiss(id, organizationId, trx) {
        if (!isValidUuid(organizationId) || !isValidUuid(id))
            return null;
        const client = this.getExecutor(trx);
        const row = await client
            .updateTable('notifications')
            .set({
            status: 'DISMISSED',
        })
            .where('id', '=', id)
            .where('organization_id', '=', organizationId)
            .returningAll()
            .executeTakeFirst();
        return row || null;
    }
    async findExistingByDedupeKey(organizationId, dedupeKey, trx) {
        if (!isValidUuid(organizationId))
            return null;
        const client = this.getExecutor(trx);
        const row = await client
            .selectFrom('notifications')
            .selectAll()
            .where('organization_id', '=', organizationId)
            .where('dedupe_key', '=', dedupeKey)
            .where('status', 'not in', ['RESOLVED', 'DISMISSED'])
            .executeTakeFirst();
        return row || null;
    }
    async createIfNotExists(organizationId, data, trx) {
        if (!isValidUuid(organizationId)) {
            return this.create(organizationId, data, trx);
        }
        if (data.dedupe_key) {
            const existing = await this.findExistingByDedupeKey(organizationId, data.dedupe_key, trx);
            if (existing) {
                return existing;
            }
        }
        try {
            return await this.create(organizationId, data, trx);
        }
        catch (err) {
            // Catch unique index conflict on dedupe_key if concurrent insert occurs
            if (data.dedupe_key) {
                return this.findExistingByDedupeKey(organizationId, data.dedupe_key, trx);
            }
            throw err;
        }
    }
}
exports.KyselyNotificationRepository = KyselyNotificationRepository;
//# sourceMappingURL=notification.repository.js.map