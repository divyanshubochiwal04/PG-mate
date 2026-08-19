import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check application and database health status' })
  @SwaggerResponse({ status: 200, description: 'System is overall healthy' })
  @SwaggerResponse({ status: 503, description: 'Database or system component is unhealthy' })
  async checkHealth(@Res() res: Response): Promise<void> {
    const { status, body } = await this.healthService.getHealthStatus();
    res.status(status).json(body);
  }

  @Get('db')
  @ApiOperation({ summary: 'Check real PostgreSQL database connectivity with SELECT 1' })
  @SwaggerResponse({ status: 200, description: 'Database is connected' })
  @SwaggerResponse({ status: 503, description: 'Database connection failed' })
  async checkDbHealth(@Res() res: Response): Promise<void> {
    const { status, body } = await this.healthService.getDbHealth();
    res.status(status).json(body);
  }
}
