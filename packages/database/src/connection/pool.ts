import { Pool, type PoolConfig } from 'pg';
import { config } from '@m-square/config';
import { logger } from '@m-square/logger';

let poolInstance: Pool | null = null;

export function createPgPool(overrideConfig?: PoolConfig): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  const defaultPoolConfig: PoolConfig = {
    connectionString: config.DATABASE_URL,
    max: 20, // Maximum pool connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

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
