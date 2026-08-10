import { type Kysely, sql } from 'kysely';
import type { DatabaseSchema } from '../schema/auth.schema';
import type { UserStatus } from '@m-square/domain';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  status?: UserStatus;
}

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class KyselyUserRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  public async findByEmail(email: string): Promise<UserRow | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where(sql`LOWER(email)`, '=', email.toLowerCase())
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  public async findById(id: string): Promise<UserRow | null> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.mapRow(row) : null;
  }

  public async create(data: CreateUserData): Promise<UserRow> {
    const row = await this.db
      .insertInto('users')
      .values({
        email: data.email.toLowerCase(),
        password_hash: data.passwordHash,
        status: data.status ?? 'ACTIVE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapRow(row);
  }

  public async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.db
      .updateTable('users')
      .set({
        password_hash: passwordHash,
        updated_at: new Date(),
      })
      .where('id', '=', userId)
      .execute();
  }

  public async updateLastLogin(userId: string, timestamp: Date): Promise<void> {
    await this.db
      .updateTable('users')
      .set({
        last_login_at: timestamp,
        updated_at: timestamp,
      })
      .where('id', '=', userId)
      .execute();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapRow(row: any): UserRow {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      status: row.status as UserStatus,
      emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at) : undefined,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
