"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = exports.DatabaseService = void 0;
const kysely_1 = require("kysely");
const pool_1 = require("./pool");
const logger_1 = require("@m-square/logger");
class DatabaseService {
    kyselyInstance = null;
    poolInstance = null;
    get db() {
        if (!this.kyselyInstance) {
            this.init();
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.kyselyInstance;
    }
    init(customPool) {
        this.poolInstance = customPool ?? (0, pool_1.createPgPool)();
        this.kyselyInstance = new kysely_1.Kysely({
            dialect: new kysely_1.PostgresDialect({
                pool: this.poolInstance,
            }),
        });
    }
    /**
     * Lightweight health check query performing `SELECT 1`.
     * Returns true if database connection is active and responsive.
     */
    async checkHealth() {
        try {
            const result = await (0, kysely_1.sql) `SELECT 1 as res`.execute(this.db);
            return result.rows.length > 0 && result.rows[0].res === 1;
        }
        catch (err) {
            logger_1.logger.error('Database health check failed', { error: err.message });
            return false;
        }
    }
    async shutdown() {
        if (this.kyselyInstance) {
            await this.kyselyInstance.destroy();
            this.kyselyInstance = null;
        }
        await (0, pool_1.closePgPool)();
    }
}
exports.DatabaseService = DatabaseService;
exports.dbService = new DatabaseService();
//# sourceMappingURL=database.js.map