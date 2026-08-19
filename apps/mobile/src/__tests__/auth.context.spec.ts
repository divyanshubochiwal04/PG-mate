import { describe, expect, it } from 'vitest';
import {
  clearTokens,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
} from '../auth/token.manager';

describe('apps/mobile — Auth State & Token Manager Lifecycle', () => {
  it('A1 — stores and clears tokens correctly on login and logout', async () => {
    await setAccessToken('test-access-token');
    await setRefreshToken('test-refresh-token');

    const token = await getAccessToken();
    expect(token).toBe('test-access-token');

    await clearTokens();
    const cleared = await getAccessToken();
    expect(cleared).toBeNull();
  });
});
