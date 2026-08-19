"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyUnitOfWork = void 0;
const logger_1 = require("@m-square/logger");
class KyselyUnitOfWork {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Executes callback within an isolated Kysely PostgreSQL transaction.
     * Automatically issues COMMIT on success and ROLLBACK on error.
     */
    async runInTransaction(work) {
        return this.db.transaction().execute(async (trx) => {
            try {
                const result = await work(trx);
                return result;
            }
            catch (err) {
                logger_1.logger.warn('Transaction aborted due to error — performing ROLLBACK', {
                    error: err.message,
                });
                throw err;
            }
        });
    }
}
exports.KyselyUnitOfWork = KyselyUnitOfWork;
//# sourceMappingURL=unit-of-work.js.map