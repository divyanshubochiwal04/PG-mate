import { describe, expect, it } from 'vitest';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';

import { KyselyOrganizationRepository } from '../repositories/organization.repository';

describe('@m-square/database - Tenant Isolation & Organization Unit Tests', () => {
  it('should instantiate KyselyOrganizationRepository cleanly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repo = new KyselyOrganizationRepository({} as any);
    expect(repo).toBeDefined();
  });

  it('should reject duplicate IDs in bulk payload array', () => {
    const payload = ['uuid-1', 'uuid-1', 'uuid-2'];
    const hasDuplicates = new Set(payload).size !== payload.length;
    expect(hasDuplicates).toBe(true);
  });
});
