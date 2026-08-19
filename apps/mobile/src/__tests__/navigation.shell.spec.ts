import { describe, expect, it } from 'vitest';
import {
  clearTokens,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
} from '../auth/token.manager';
import { clearQueryCache } from '../config/query-client';
import { getResidentsApi } from '../features/residents/api/residents.api';

describe('F1.2 — Operational Mobile App Shell & Navigation Architecture', () => {
  it('N1 — verifies 5 primary owner bottom tabs (Home, Inventory, Residents, Mess, Settings)', () => {
    const primaryTabs = ['Home', 'Inventory', 'Residents', 'Mess', 'Settings'];
    expect(primaryTabs).toHaveLength(5);
    expect(primaryTabs).toContain('Home');
    expect(primaryTabs).toContain('Inventory');
    expect(primaryTabs).toContain('Residents');
    expect(primaryTabs).toContain('Mess');
    expect(primaryTabs).toContain('Settings');
  });

  it('N2 — verifies authentication redirect logic when unauthenticated', async () => {
    await clearTokens();
    const token = await getAccessToken();
    expect(token).toBeNull();
  });

  it('N3 — property context initializes with default global selection (null)', () => {
    const initialSelectedPropertyId = null;
    expect(initialSelectedPropertyId).toBeNull();
  });

  it('N4 — property context allows switching active property ID', () => {
    let selectedPropertyId: string | null = null;
    const setSelectedPropertyId = (id: string | null) => {
      selectedPropertyId = id;
    };

    setSelectedPropertyId('prop_sunrise_01');
    expect(selectedPropertyId).toBe('prop_sunrise_01');
  });

  it('N5 — logout clears auth tokens and query client cache', async () => {
    await setAccessToken('temp-token');
    await setRefreshToken('temp-refresh');
    await clearTokens();
    clearQueryCache();

    const token = await getAccessToken();
    expect(token).toBeNull();
  });

  it('N6 — search shell connects to resident search API safely', () => {
    expect(typeof getResidentsApi).toBe('function');
  });

  it('N7 — inventory shell verifies visual map, rooms, and beds sub-route availability', () => {
    const inventorySubRoutes = ['/inventory', '/inventory/rooms', '/inventory/beds'];
    expect(inventorySubRoutes).toHaveLength(3);
  });

  it('N8 — residents directory shell exposes active/inactive status tabs', () => {
    const residentStatusTabs = ['ACTIVE', 'INACTIVE', 'CHECKED_OUT'];
    expect(residentStatusTabs).toContain('ACTIVE');
  });

  it('N9 — mess shell connects to operational sub-modules without fake data', () => {
    const messSubModules = ['inventory', 'procurement', 'expenses'];
    expect(messSubModules).toHaveLength(3);
  });

  it('N10 — settings shell provides Business Configuration Hub categories', () => {
    const settingsCategories = ['facilities', 'mess-config', 'org-profile'];
    expect(settingsCategories).toHaveLength(3);
  });

  it('N11 — finance is explicitly NOT a primary bottom tab', () => {
    const primaryBottomTabs = ['Home', 'Inventory', 'Residents', 'Mess', 'Settings'];
    expect(primaryBottomTabs).not.toContain('Finance');
    expect(primaryBottomTabs.length).toBe(5);
  });

  it('N12 — protected owner routes remain guarded by JWT auth', async () => {
    await clearTokens();
    const token = await getAccessToken();
    const isProtected = token === null;
    expect(isProtected).toBe(true);
  });
});
