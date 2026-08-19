"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyPasswordResetTokenRepository = void 0;
class KyselyPasswordResetTokenRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async createToken(data) {
        const row = await this.db
            .insertInto('password_reset_tokens')
            .values({
            user_id: data.userId,
            token_hash: data.tokenHash,
            expires_at: data.expiresAt,
        })
            .returningAll()
            .executeTakeFirstOrThrow();
        return this.mapRow(row);
    }
    async findByHashForUpdate(tokenHash) {
        const row = await this.db
            .selectFrom('password_reset_tokens')
            .selectAll()
            .where('token_hash', '=', tokenHash)
            .forUpdate()
            .executeTakeFirst();
        return row ? this.mapRow(row) : null;
    }
    async markUsed(tokenId, usedAt) {
        await this.db
            .updateTable('password_reset_tokens')
            .set({ used_at: usedAt })
            .where('id', '=', tokenId)
            .execute();
    }
    async invalidateAllUserTokens(userId) {
        await this.db
            .updateTable('password_reset_tokens')
            .set({ used_at: new Date() })
            .where('user_id', '=', userId)
            .where('used_at', 'is', null)
            .execute();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapRow(row) {
        return {
            id: row.id,
            userId: row.user_id,
            tokenHash: row.token_hash,
            expiresAt: new Date(row.expires_at),
            usedAt: row.used_at ? new Date(row.used_at) : undefined,
            createdAt: new Date(row.created_at),
        };
    }
}
exports.KyselyPasswordResetTokenRepository = KyselyPasswordResetTokenRepository;
//# sourceMappingURL=password-reset-token.repository.js.map