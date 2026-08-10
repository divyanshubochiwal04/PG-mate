import { describe, expect, it } from 'vitest';
import { deleteSecureItem, getSecureItem, setSecureItem } from '../storage/secure-store';

describe('apps/mobile — Secure Store Abstraction', () => {
  it('SS1 — stores, retrieves, and deletes item correctly', async () => {
    await setSecureItem('TEST_KEY', 'TEST_VALUE');
    const value = await getSecureItem('TEST_KEY');
    expect(value).toBe('TEST_VALUE');

    await deleteSecureItem('TEST_KEY');
    const deletedValue = await getSecureItem('TEST_KEY');
    expect(deletedValue).toBeNull();
  });
});
