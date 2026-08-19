import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Discovery')
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Root service discovery' })
  @ApiResponse({ status: 200, description: 'Service operational status' })
  getRoot() {
    return {
      name: 'PG Mate API',
      status: 'operational',
      apiBasePath: '/api/v1',
      health: '/api/v1/health',
    };
  }

  @Get('api')
  @ApiOperation({ summary: 'API base discovery' })
  @ApiResponse({ status: 200, description: 'API base information' })
  getApiBase() {
    return {
      name: 'PG Mate API',
      status: 'operational',
      currentVersion: '/api/v1',
      health: '/api/v1/health',
    };
  }
}

@ApiTags('Discovery')
@Controller({ version: '1' })
export class ApiV1Controller {
  @Get()
  @ApiOperation({ summary: 'API v1 discovery' })
  @ApiResponse({ status: 200, description: 'API v1 operational status' })
  getV1Root() {
    return {
      name: 'PG Mate API',
      version: 'v1',
      status: 'operational',
      health: '/api/v1/health',
    };
  }
}
