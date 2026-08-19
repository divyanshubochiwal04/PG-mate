import { type Kysely, type Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type { NotificationRow } from '../schema/notification.schema';
import type { NotificationQueryDto } from '@m-square/contracts';
import type { NotificationRepository } from './notification-repository.interface';
export declare class KyselyNotificationRepository implements NotificationRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    protected getExecutor(trx?: Transaction<DatabaseSchema>): Kysely<DatabaseSchema>;
    create(organizationId: string, data: Omit<NotificationRow, 'id' | 'created_at' | 'organization_id'>, trx?: Transaction<DatabaseSchema>): Promise<NotificationRow>;
    findById(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<NotificationRow | null>;
    findByOrganization(organizationId: string, query: NotificationQueryDto, trx?: Transaction<DatabaseSchema>): Promise<{
        data: NotificationRow[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    countUnread(organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<number>;
    markRead(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<NotificationRow | null>;
    markUnread(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<NotificationRow | null>;
    markAllRead(organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<number>;
    resolve(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<NotificationRow | null>;
    dismiss(id: string, organizationId: string, trx?: Transaction<DatabaseSchema>): Promise<NotificationRow | null>;
    findExistingByDedupeKey(organizationId: string, dedupeKey: string, trx?: Transaction<DatabaseSchema>): Promise<NotificationRow | null>;
    createIfNotExists(organizationId: string, data: Omit<NotificationRow, 'id' | 'created_at' | 'organization_id'>, trx?: Transaction<DatabaseSchema>): Promise<NotificationRow | null>;
}
//# sourceMappingURL=notification.repository.d.ts.map