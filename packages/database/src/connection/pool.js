"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPgPool = createPgPool;
exports.closePgPool = closePgPool;
const pg_1 = require("pg");
const config_1 = require("@m-square/config");
const logger_1 = require("@m-square/logger");
let poolInstance = null;
function createPgPool(overrideConfig) {
    if (poolInstance) {
        return poolInstance;
    }
    const isRemote = config_1.config.DATABASE_URL.includes('supabase') ||
        config_1.config.DATABASE_URL.includes('pooler') ||
        config_1.config.DATABASE_URL.includes('onrender') ||
        config_1.config.DATABASE_URL.includes('sslmode') ||
        process.env['NODE_ENV'] === 'production';
    const defaultPoolConfig = {
        connectionString: config_1.config.DATABASE_URL,
        max: 20, // Maximum pool connections
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {}),
    };
    try {
        const parsed = new URL(config_1.config.DATABASE_URL.replace(/^postgres(ql)?:\/\//, 'http://'));
        logger_1.logger.info('Database connection target configured', {
            host: parsed.hostname,
            port: parsed.port || '5432',
            ssl: isRemote,
        });
    }
    catch {
        // URL parsing failed, skip non-fatal diagnostic
    }
    poolInstance = new pg_1.Pool(overrideConfig ?? defaultPoolConfig);
    poolInstance.on('error', (err) => {
        logger_1.logger.error('Unexpected database pool error', { error: err.message });
    });
    return poolInstance;
}
async function closePgPool() {
    if (poolInstance) {
        try {
            if (!poolInstance.ending && !poolInstance.ended) {
                await poolInstance.end();
            }
        }
        catch {
            // Ignore if pool was already destroyed by Kysely
        }
        finally {
            poolInstance = null;
            logger_1.logger.info('Database pool shut down cleanly');
        }
    }
}
//# sourceMappingURL=pool.js.map