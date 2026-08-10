import { Injectable } from '@nestjs/common';
import { dbService } from '@m-square/database';
import type { HealthResponseDto } from './dto/health-response.dto';

@Injectable()
export class HealthService {
  /**
   * Performs application and lightweight database (SELECT 1) health checks.
   */
  public async getHealthStatus(): Promise<{ status: number; body: HealthResponseDto }> {
    const isDbHealthy = await dbService.checkHealth();
    const isOverallHealthy = isDbHealthy;

    const status = isOverallHealthy ? 200 : 503;
    const body: HealthResponseDto = {
      status: isOverallHealthy ? 'ok' : 'error',
      checks: {
        application: 'ok',
        database: isDbHealthy ? 'ok' : 'error',
      },
    };

    return { status, body };
  }
}
