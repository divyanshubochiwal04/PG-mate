import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
export interface CreateSessionData {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
}
export interface SessionRow {
    id: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    lastUsedAt: Date;
    expiresAt: Date;
    revokedAt?: Date;
    revocationReason?: string;
}
export declare class KyselySessionRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>);
    createSession(data: CreateSessionData): Promise<SessionRow>;
    findActiveById(sessionId: string): Promise<SessionRow | null>;
    revokeSession(sessionId: string, reason: string): Promise<void>;
    revokeAllUserSessions(userId: string, reason: string): Promise<number>;
    touchSession(sessionId: string): Promise<void>;
    private mapRow;
}
//# sourceMappingURL=session.repository.d.ts.map