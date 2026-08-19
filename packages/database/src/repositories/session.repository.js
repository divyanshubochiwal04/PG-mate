"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselySessionRepository = void 0;
class KyselySessionRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async createSession(data) {
        const row = await this.db
            .insertInto('user_sessions')
            .values({
            user_id: data.userId,
            ip_address: data.ipAddress ?? null,
            user_agent: data.userAgent ? data.userAgent.slice(0, 500) : null,
            expires_at: data.expiresAt,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return this.mapRow(row);
    }
    async findActiveById(sessionId) {
        const row = await this.db
            .selectFrom('user_sessions')
            .selectAll()
            .where('id', '=', sessionId)
            .where('revoked_at', 'is', null)
            .where('expires_at', '>', new Date())
            .executeTakeFirst();
        return row ? this.mapRow(row) : null;
    }
    async revokeSession(sessionId, reason) {
        await this.db
            .updateTable('user_sessions')
            .set({
            revoked_at: new Date(),
            revocation_reason: reason,
        })
            .where('id', '=', sessionId)
            .execute();
    }
    async revokeAllUserSessions(userId, reason) {
        const result = await this.db
            .updateTable('user_sessions')
            .set({
            revoked_at: new Date(),
            revocation_reason: reason,
        })
            .where('user_id', '=', userId)
            .where('revoked_at', 'is', null)
            .executeTakeFirst();
        return Number(result.numUpdatedRows);
    }
    async touchSession(sessionId) {
        await this.db
            .updateTable('user_sessions')
            .set({ last_used_at: new Date() })
            .where('id', '=', sessionId)
            .execute();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRow(row) {
        return {
            id: row.id,
            userId: row.user_id,
            ipAddress: row.ip_address ?? undefined,
            userAgent: row.user_agent ?? undefined,
            createdAt: new Date(row.created_at),
            lastUsedAt: new Date(row.last_used_at),
            expiresAt: new Date(row.expires_at),
            revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
            revocationReason: row.revocation_reason ?? undefined,
        };
    }
}
exports.KyselySessionRepository = KyselySessionRepository;
//# sourceMappingURL=session.repository.js.map