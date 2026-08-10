import { describe, expect, it } from 'vitest';
import { apiClient } from '../api/client';

describe('apps/mobile — Centralized HTTP API Client', () => {
  it('C1 — has base URL and default timeout configured', () => {
    expect(apiClient.defaults.baseURL).toBeDefined();
    expect(apiClient.defaults.timeout).toBe(15000);
  });
});
