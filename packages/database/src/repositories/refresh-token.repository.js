"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyRefreshTokenRepository = void 0;
class KyselyRefreshTokenRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async createToken(data) {
        const row = await this.db
            .insertInto('refresh_tokens')
            .values({
            session_id: data.sessionId,
            token_hash: data.tokenHash,
            status: data.status ?? 'ACTIVE',
            expires_at: data.expiresAt,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return this.mapRow(row);
    }
    async findByHashForUpdate(tokenHash) {
        const row = await this.db
            .selectFrom('refresh_tokens')
            .selectAll()
            .where('token_hash', '=', tokenHash)
            .forUpdate()
            .executeTakeFirst();
        return row ? this.mapRow(row) : null;
    }
    async markRotated(tokenId, usedAt) {
        await this.db
            .updateTable('refresh_tokens')
            .set({
            status: 'ROTATED',
            used_at: usedAt,
        })
            .where('id', '=', tokenId)
            .execute();
    }
    async revokeSessionTokens(sessionId) {
        await this.db
            .updateTable('refresh_tokens')
            .set({ status: 'REVOKED' })
            .where('session_id', '=', sessionId)
            .execute();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRow(row) {
        return {
            id: row.id,
            sessionId: row.session_id,
            tokenHash: row.token_hash,
            status: row.status,
            createdAt: new Date(row.created_at),
            expiresAt: new Date(row.expires_at),
            usedAt: row.used_at ? new Date(row.used_at) : undefined,
        };
    }
}
exports.KyselyRefreshTokenRepository = KyselyRefreshTokenRepository;
//# sourceMappingURL=refresh-token.repository.js.map