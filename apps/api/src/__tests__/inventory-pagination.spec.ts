import { describe, expect, it, vi } from 'vitest';

process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import { KyselyPropertyRepository } from '@m-square/database';
import type { PropertyRow } from '@m-square/database';
import { PropertyBuildingService } from '../modules/inventory/services/property-building.service';

const ORG = 'org-p1a-test';

function makePropertyList(count: number): PropertyRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `prop-${i + 1}`,
    organization_id: ORG,
    name: i % 2 === 0 ? `Green Glen Tower ${i + 1}` : `Blue Ridge ${i + 1}`,
    code: `PROP-${i + 1}`,
    address_line1: 'Road 1',
    address_line2: null,
    locality: 'Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560103',
    status: i < 7 ? 'ACTIVE' : 'INACTIVE',
    created_at: new Date(Date.now() - i * 1000),
    updated_at: new Date(Date.now() - i * 1000),
  }));
}

describe('apps/api — M5 Filtered Pagination COUNT (P1-A Regression Suite)', () => {
  const service = new PropertyBuildingService();

  it('L1 — search filter correctly updates pagination.total, totalPages, and hasNext', async () => {
    const allProps = makePropertyList(10);

    vi.spyOn(KyselyPropertyRepository.prototype, 'findAllForOrganization').mockImplementation(
      async (orgId, params, search) => {
        let filtered = allProps.filter((p) => p.organization_id === orgId);
        if (search) {
          filtered = filtered.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase())
          );
        }
        const total = filtered.length;
        const page = params.page || 1;
        const pageSize = params.pageSize || 2;
        const offset = (page - 1) * pageSize;
        const items = filtered.slice(offset, offset + pageSize);

        return {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize) || 1,
            hasNext: page * pageSize < total,
            hasPrevious: page > 1,
          },
        };
      }
    );

    const res = await service.getProperties(ORG, { page: 1, pageSize: 2 }, 'Green');

    expect(res.pagination.total).toBe(5);
    expect(res.pagination.totalPages).toBe(3);
    expect(res.pagination.hasNext).toBe(true);
    expect(res.items.length).toBe(2);
  });

  it('L2 — status=ACTIVE filter correctly updates pagination.total', async () => {
    const allProps = makePropertyList(10); // 7 ACTIVE, 3 INACTIVE

    vi.spyOn(KyselyPropertyRepository.prototype, 'findAllForOrganization').mockImplementation(
      async (orgId, params, _search, status) => {
        let filtered = allProps.filter((p) => p.organization_id === orgId);
        if (status) {
          filtered = filtered.filter((p) => p.status === status);
        }
        const total = filtered.length;
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const items = filtered.slice(0, pageSize);

        return {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize) || 1,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }
    );

    const res = await service.getProperties(ORG, { page: 1, pageSize: 10 }, undefined, 'ACTIVE');

    expect(res.pagination.total).toBe(7);
    expect(res.pagination.totalPages).toBe(1);
    expect(res.items.length).toBe(7);
  });

  it('L3 — search + status filter combined correctly updates pagination.total', async () => {
    const allProps = makePropertyList(10);
    // Green Glen: indices 0,2,4,6,8. Status ACTIVE: indices 0..6. Combined match: 0,2,4,6 = 4 items
    const matching = allProps.filter((p) => p.name.includes('Green') && p.status === 'ACTIVE');

    vi.spyOn(KyselyPropertyRepository.prototype, 'findAllForOrganization').mockResolvedValue({
      items: matching,
      pagination: {
        page: 1,
        pageSize: 10,
        total: matching.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });

    const res = await service.getProperties(ORG, { page: 1, pageSize: 10 }, 'Green', 'ACTIVE');

    expect(res.pagination.total).toBe(4);
    expect(res.pagination.totalPages).toBe(1);
    expect(res.items.length).toBe(4);
  });

  it('L4 — requesting page beyond filtered result count returns empty items with accurate total', async () => {
    vi.spyOn(KyselyPropertyRepository.prototype, 'findAllForOrganization').mockResolvedValue({
      items: [],
      pagination: {
        page: 99,
        pageSize: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrevious: true,
      },
    });

    const res = await service.getProperties(ORG, { page: 99, pageSize: 10 }, 'Green');

    expect(res.items.length).toBe(0);
    expect(res.pagination.total).toBe(2);
    expect(res.pagination.totalPages).toBe(1);
    expect(res.pagination.hasNext).toBe(false);
    expect(res.pagination.hasPrevious).toBe(true);
  });
});
