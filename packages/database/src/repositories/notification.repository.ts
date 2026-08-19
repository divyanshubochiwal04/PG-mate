import { type Kysely, sql, type Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type { NotificationRow } from '../schema/notification.schema';
import type { NotificationQueryDto } from '@m-square/contracts';
import type { NotificationRepository } from './notification-repository.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export class KyselyNotificationRepository implements NotificationRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  protected getExecutor(trx?: Transaction<DatabaseSchema>) {
    return trx && typeof (trx as unknown as Record<string, unknown>).selectFrom === 'function'
      ? trx
      : this.db;
  }

  public async create(
    organizationId: string,
    data: Omit<NotificationRow, 'id' | 'created_at' | 'organization_id'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<NotificationRow> {
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

  public async findById(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<NotificationRow | null> {
    if (!isValidUuid(organizationId) || !isValidUuid(id)) return null;

    const client = this.getExecutor(trx);
    const row = await client
      .selectFrom('notifications')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();
    return row || null;
  }

  public async findByOrganization(
    organizationId: string,
    query: NotificationQueryDto,
    trx?: Transaction<DatabaseSchema>
  ): Promise<{
    data: NotificationRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
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
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb('title', 'ilike', searchPattern),
          eb('message', 'ilike', searchPattern),
        ])
      );
    }
    if (query.fromDate) {
      baseQuery = baseQuery.where('created_at', '>=', new Date(query.fromDate));
    }
    if (query.toDate) {
      baseQuery = baseQuery.where('created_at', '<=', new Date(query.toDate));
    }

    const countResult = await baseQuery
      .select(sql<number>`count(*)::int`.as('total'))
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

  public async countUnread(
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<number> {
    if (!isValidUuid(organizationId)) return 0;

    const client = this.getExecutor(trx);
    const result = await client
      .selectFrom('notifications')
      .select(sql<number>`count(*)::int`.as('count'))
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'UNREAD')
      .executeTakeFirst();
    return result?.count || 0;
  }

  public async markRead(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<NotificationRow | null> {
    if (!isValidUuid(organizationId) || !isValidUuid(id)) return null;

    const client = this.getExecutor(trx);
    const row = await client
      .updateTable('notifications')
      .set({
        status: 'READ',
        read_at: sql`CURRENT_TIMESTAMP`,
      })
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();
    return row || null;
  }

  public async markUnread(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<NotificationRow | null> {
    if (!isValidUuid(organizationId) || !isValidUuid(id)) return null;

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

  public async markAllRead(
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<number> {
    if (!isValidUuid(organizationId)) return 0;

    const client = this.getExecutor(trx);
    const result = await client
      .updateTable('notifications')
      .set({
        status: 'READ',
        read_at: sql`CURRENT_TIMESTAMP`,
      })
      .where('organization_id', '=', organizationId)
      .where('status', '=', 'UNREAD')
      .execute();
    return Number(result[0]?.numUpdatedRows || 0);
  }

  public async resolve(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<NotificationRow | null> {
    if (!isValidUuid(organizationId) || !isValidUuid(id)) return null;

    const client = this.getExecutor(trx);
    const row = await client
      .updateTable('notifications')
      .set({
        status: 'RESOLVED',
        resolved_at: sql`CURRENT_TIMESTAMP`,
      })
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .returningAll()
      .executeTakeFirst();
    return row || null;
  }

  public async dismiss(
    id: string,
    organizationId: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<NotificationRow | null> {
    if (!isValidUuid(organizationId) || !isValidUuid(id)) return null;

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

  public async findExistingByDedupeKey(
    organizationId: string,
    dedupeKey: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<NotificationRow | null> {
    if (!isValidUuid(organizationId)) return null;

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

  public async createIfNotExists(
    organizationId: string,
    data: Omit<NotificationRow, 'id' | 'created_at' | 'organization_id'>,
    trx?: Transaction<DatabaseSchema>
  ): Promise<NotificationRow | null> {
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
    } catch (err) {
      // Catch unique index conflict on dedupe_key if concurrent insert occurs
      if (data.dedupe_key) {
        return this.findExistingByDedupeKey(organizationId, data.dedupe_key, trx);
      }
      throw err;
    }
  }
}
