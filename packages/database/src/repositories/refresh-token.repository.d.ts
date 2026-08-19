import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
export interface CreateRefreshTokenData {
    sessionId: string;
    tokenHash: string;
    expiresAt: Date;
    status?: 'ACTIVE' | 'ROTATED' | 'REVOKED';
}
export interface RefreshTokenRow {
    id: string;
    sessionId: string;
    tokenHash: string;
    status: 'ACTIVE' | 'ROTATED' | 'REVOKED';
    createdAt: Date;
    expiresAt: Date;
    usedAt?: Date;
}
export declare class KyselyRefreshTokenRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>);
    createToken(data: CreateRefreshTokenData): Promise<RefreshTokenRow>;
    findByHashForUpdate(tokenHash: string): Promise<RefreshTokenRow | null>;
    markRotated(tokenId: string, usedAt: Date): Promise<void>;
    revokeSessionTokens(sessionId: string): Promise<void>;
    private mapRow;
}
//# sourceMappingURL=refresh-token.repository.d.ts.map