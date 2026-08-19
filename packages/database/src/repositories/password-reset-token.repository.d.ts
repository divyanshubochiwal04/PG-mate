import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
export interface CreateResetTokenData {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
}
export interface PasswordResetTokenRow {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt?: Date;
    createdAt: Date;
}
export declare class KyselyPasswordResetTokenRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>);
    createToken(data: CreateResetTokenData): Promise<PasswordResetTokenRow>;
    findByHashForUpdate(tokenHash: string): Promise<PasswordResetTokenRow | null>;
    markUsed(tokenId: string, usedAt: Date): Promise<void>;
    invalidateAllUserTokens(userId: string): Promise<void>;
    private mapRow;
}
//# sourceMappingURL=password-reset-token.repository.d.ts.map