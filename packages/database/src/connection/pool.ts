import { Pool, type PoolConfig } from 'pg';
import { config } from '@m-square/config';
import { logger } from '@m-square/logger';

let poolInstance: Pool | null = null;

export function createPgPool(overrideConfig?: PoolConfig): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  const isRemote =
    config.DATABASE_URL.includes('supabase') ||
    config.DATABASE_URL.includes('pooler') ||
    config.DATABASE_URL.includes('onrender') ||
    config.DATABASE_URL.includes('sslmode') ||
    process.env['NODE_ENV'] === 'production';

  const defaultPoolConfig: PoolConfig = {
    connectionString: config.DATABASE_URL,
    max: 20, // Maximum pool connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {}),
  };

  try {
    const parsed = new URL(config.DATABASE_URL.replace(/^postgres(ql)?:\/\//, 'http://'));
    logger.info('Database connection target configured', {
      host: parsed.hostname,
      port: parsed.port || '5432',
      ssl: isRemote,
    });
  } catch {
    // URL parsing failed, skip non-fatal diagnostic
  }

  poolInstance = new Pool(overrideConfig ?? defaultPoolConfig);

  poolInstance.on('error', (err) => {
    logger.error('Unexpected database pool error', { error: err.message });
  });

  return poolInstance;
}

export async function closePgPool(): Promise<void> {
  if (poolInstance) {
    try {
      if (!(poolInstance as any).ending && !(poolInstance as any).ended) {
        await poolInstance.end();
      }
    } catch {
      // Ignore if pool was already destroyed by Kysely
    } finally {
      poolInstance = null;
      logger.info('Database pool shut down cleanly');
    }
  }
}
