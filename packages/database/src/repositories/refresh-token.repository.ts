import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/auth.schema';

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

export class KyselyRefreshTokenRepository {
  constructor(private readonly db: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>) {}

  public async createToken(data: CreateRefreshTokenData): Promise<RefreshTokenRow> {
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

  public async findByHashForUpdate(tokenHash: string): Promise<RefreshTokenRow | null> {
    const row = await this.db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .forUpdate()
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  public async markRotated(tokenId: string, usedAt: Date): Promise<void> {
    await this.db
      .updateTable('refresh_tokens')
      .set({
        status: 'ROTATED',
        used_at: usedAt,
      })
      .where('id', '=', tokenId)
      .execute();
  }

  public async revokeSessionTokens(sessionId: string): Promise<void> {
    await this.db
      .updateTable('refresh_tokens')
      .set({ status: 'REVOKED' })
      .where('session_id', '=', sessionId)
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRow(row: any): RefreshTokenRow {
    return {
      id: row.id,
      sessionId: row.session_id,
      tokenHash: row.token_hash,
      status: row.status as 'ACTIVE' | 'ROTATED' | 'REVOKED',
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      usedAt: row.used_at ? new Date(row.used_at) : undefined,
    };
  }
}
