import { type Kysely } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
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
export declare class KyselyUserRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema>);
    findByEmail(email: string): Promise<UserRow | null>;
    findById(id: string): Promise<UserRow | null>;
    create(data: CreateUserData): Promise<UserRow>;
    updatePassword(userId: string, passwordHash: string): Promise<void>;
    updateLastLogin(userId: string, timestamp: Date): Promise<void>;
    private mapRow;
}
//# sourceMappingURL=user.repository.d.ts.map