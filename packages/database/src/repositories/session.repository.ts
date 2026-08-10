import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/auth.schema';

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

export class KyselySessionRepository {
  constructor(private readonly db: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>) {}

  public async createSession(data: CreateSessionData): Promise<SessionRow> {
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

  public async findActiveById(sessionId: string): Promise<SessionRow | null> {
    const row = await this.db
      .selectFrom('user_sessions')
      .selectAll()
      .where('id', '=', sessionId)
      .where('revoked_at', 'is', null)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  public async revokeSession(sessionId: string, reason: string): Promise<void> {
    await this.db
      .updateTable('user_sessions')
      .set({
        revoked_at: new Date(),
        revocation_reason: reason,
      })
      .where('id', '=', sessionId)
      .execute();
  }

  public async revokeAllUserSessions(userId: string, reason: string): Promise<number> {
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

  public async touchSession(sessionId: string): Promise<void> {
    await this.db
      .updateTable('user_sessions')
      .set({ last_used_at: new Date() })
      .where('id', '=', sessionId)
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRow(row: any): SessionRow {
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
