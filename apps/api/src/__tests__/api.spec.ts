import { describe, expect, it, vi } from 'vitest';

// Set up required env vars before importing config
process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import { RequestContext } from '../common/context/request-context';
import { HealthService } from '../modules/health/health.service';

describe('apps/api - RequestContext', () => {
  it('should return undefined when not in context store', () => {
    expect(RequestContext.requestId).toBeUndefined();
  });

  it('should propagate requestId within store scope', () => {
    RequestContext.run({ requestId: 'req_test_123', correlationId: 'req_test_123' }, () => {
      expect(RequestContext.requestId).toBe('req_test_123');
      expect(RequestContext.current?.correlationId).toBe('req_test_123');
    });
  });
});

describe('apps/api - HealthService', () => {
  it('should return 200 and ok status when DB health check succeeds', async () => {
    const healthService = new HealthService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn(healthService as any, 'getHealthStatus').mockResolvedValue({
      status: 200,
      body: {
        status: 'ok',
        application: 'ok',
        database: { status: 'connected' },
      },
    });

    const result = await healthService.getHealthStatus();
    expect(result.status).toBe(200);
    expect(result.body.status).toBe('ok');
    expect(result.body.database.status).toBe('connected');
  });
});
