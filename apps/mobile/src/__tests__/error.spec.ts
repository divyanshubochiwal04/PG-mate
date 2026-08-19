import { describe, expect, it } from 'vitest';
import { normalizeApiError } from '../api/error';

describe('apps/mobile — API Error Normalizer', () => {
  it('E1 — normalizes 401 Unauthorized response', () => {
    const error = normalizeApiError({ response: { status: 401, data: {} } });
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Your session has expired or authentication failed');
  });

  it('E2 — normalizes Network Error / offline connection failure', () => {
    const error = normalizeApiError({ request: {}, message: 'Network Error' });
    expect(error.statusCode).toBe(0);
    expect(error.message).toContain('Unable to connect to M Square server');
  });

  it('E3 — extracts backend validation array messages', () => {
    const error = normalizeApiError({
      response: {
        status: 400,
        data: { message: ['email must be a valid email', 'password is too short'] },
      },
    });
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('email must be a valid email, password is too short');
  });

  it('E4 — normalizes 404 Not Found response', () => {
    const error = normalizeApiError({ response: { status: 404, data: {} } });
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('The requested record was not found.');
  });

  it('E5 — normalizes 409 Conflict response', () => {
    const error = normalizeApiError({ response: { status: 409, data: {} } });
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('This operation conflicts with the current state.');
  });

  it('E6 — normalizes 503 Service Unavailable', () => {
    const error = normalizeApiError({ response: { status: 503, data: {} } });
    expect(error.statusCode).toBe(503);
    expect(error.message).toBe('Service temporarily unavailable. Please try again.');
  });
});
