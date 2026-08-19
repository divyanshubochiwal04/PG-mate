import { Injectable } from '@nestjs/common';
import { dbService } from '@m-square/database';

export interface DatabaseHealthResult {
  status: 'connected' | 'disconnected';
  message?: string;
}

export interface HealthStatusResponse {
  status: 'ok' | 'error';
  application: 'ok';
  database: DatabaseHealthResult;
}

@Injectable()
export class HealthService {
  /**
   * Performs real SELECT 1 database health check through active Kysely connection pool.
   */
  public async getDbHealth(): Promise<{ status: number; body: { status: string; database: DatabaseHealthResult } }> {
    const isDbHealthy = await dbService.checkHealth();
    const statusCode = isDbHealthy ? 200 : 503;
    const body = {
      status: isDbHealthy ? 'ok' : 'error',
      database: {
        status: (isDbHealthy ? 'connected' : 'disconnected') as 'connected' | 'disconnected',
        ...(isDbHealthy ? {} : { message: 'Database connection unresponsive' }),
      },
    };
    return { status: statusCode, body };
  }

  /**
   * Performs application and database health checks.
   */
  public async getHealthStatus(): Promise<{ status: number; body: HealthStatusResponse }> {
    const isDbHealthy = await dbService.checkHealth();
    const isOverallHealthy = isDbHealthy;
    const statusCode = isOverallHealthy ? 200 : 503;

    const body: HealthStatusResponse = {
      status: isOverallHealthy ? 'ok' : 'error',
      application: 'ok',
      database: {
        status: isDbHealthy ? 'connected' : 'disconnected',
        ...(isDbHealthy ? {} : { message: 'Database connection unresponsive' }),
      },
    };

    return { status: statusCode, body };
  }
}
