import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/auth.schema';

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

export class KyselyPasswordResetTokenRepository {
  constructor(private readonly db: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>) {}

  public async createToken(data: CreateResetTokenData): Promise<PasswordResetTokenRow> {
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

  public async findByHashForUpdate(tokenHash: string): Promise<PasswordResetTokenRow | null> {
    const row = await this.db
      .selectFrom('password_reset_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .forUpdate()
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  public async markUsed(tokenId: string, usedAt: Date): Promise<void> {
    await this.db
      .updateTable('password_reset_tokens')
      .set({ used_at: usedAt })
      .where('id', '=', tokenId)
      .execute();
  }

  public async invalidateAllUserTokens(userId: string): Promise<void> {
    await this.db
      .updateTable('password_reset_tokens')
      .set({ used_at: new Date() })
      .where('user_id', '=', userId)
      .where('used_at', 'is', null)
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRow(row: any): PasswordResetTokenRow {
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
