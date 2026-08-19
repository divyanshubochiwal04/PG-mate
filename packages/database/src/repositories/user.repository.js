"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyUserRepository = void 0;
const kysely_1 = require("kysely");
class KyselyUserRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findByEmail(email) {
        const row = await this.db
            .selectFrom('users')
            .selectAll()
            .where((0, kysely_1.sql) `LOWER(email)`, '=', email.toLowerCase())
            .executeTakeFirst();
        return row ? this.mapRow(row) : null;
    }
    async findById(id) {
        const row = await this.db
            .selectFrom('users')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        return row ? this.mapRow(row) : null;
    }
    async create(data) {
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
    async updatePassword(userId, passwordHash) {
        await this.db
            .updateTable('users')
            .set({
            password_hash: passwordHash,
            updated_at: new Date(),
        })
            .where('id', '=', userId)
            .execute();
    }
    async updateLastLogin(userId, timestamp) {
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
    mapRow(row) {
        return {
            id: row.id,
            email: row.email,
            passwordHash: row.password_hash,
            status: row.status,
            emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at) : undefined,
            lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}
exports.KyselyUserRepository = KyselyUserRepository;
//# sourceMappingURL=user.repository.js.map