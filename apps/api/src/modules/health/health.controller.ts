import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import type { HealthService } from './health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check application and database health status' })
  @SwaggerResponse({
    status: 200,
    description: 'System is overall healthy',
    type: HealthResponseDto,
  })
  @SwaggerResponse({
    status: 503,
    description: 'Database or system component is unhealthy',
    type: HealthResponseDto,
  })
  async checkHealth(@Res() res: Response): Promise<void> {
    const { status, body } = await this.healthService.getHealthStatus();
    res.status(status).json(body);
  }
}
