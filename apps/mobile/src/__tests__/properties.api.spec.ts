import { describe, expect, it } from 'vitest';
import { createPropertyApi, getPropertiesApi } from '../features/properties/api/properties.api';

describe('apps/mobile — Properties API Feature', () => {
  it('P1 — should expose getPropertiesApi function signature', () => {
    expect(typeof getPropertiesApi).toBe('function');
  });

  it('P2 — should expose createPropertyApi function signature', () => {
    expect(typeof createPropertyApi).toBe('function');
  });
});
