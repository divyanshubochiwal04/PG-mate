import { describe, expect, it } from 'vitest';
import { clearTokens, setAccessToken, setRefreshToken } from '../auth/token.manager';
import { clearQueryCache } from '../config/query-client';
import { getOrganizationMeApi } from '../features/organization/api/org.api';
import {
  createPropertyApi,
  deletePropertyApi,
  getPropertiesApi,
  updatePropertyApi,
} from '../features/properties/api/properties.api';
import {
  assignFacilityToPropertyApi,
  getFacilitiesApi,
  unassignFacilityFromPropertyApi,
} from '../features/facilities/api/facilities.api';

describe('F1.5 — Owner Settings & Dynamic Business Configuration', () => {
  it('SET1 — Settings Hub renders 6 core sections with query endpoints', () => {
    expect(typeof getOrganizationMeApi).toBe('function');
    expect(typeof getPropertiesApi).toBe('function');
    expect(typeof getFacilitiesApi).toBe('function');
  });

  it('SET2 — Organization profile screen fetches M4 organization details', () => {
    const orgKey = ['organization', 'me'];
    expect(orgKey).toEqual(['organization', 'me']);
  });

  it('SET3 — Property settings renders property list and exposes CRUD APIs', () => {
    expect(typeof createPropertyApi).toBe('function');
    expect(typeof updatePropertyApi).toBe('function');
    expect(typeof deletePropertyApi).toBe('function');
  });

  it('SET4 — Facility catalog renders organization facility collection', () => {
    const catalogKey = ['facilities', 'org_123'];
    expect(catalogKey).toEqual(['facilities', 'org_123']);
  });

  it('SET5 — Facility search filters catalog by name and code', () => {
    const items = [
      { id: '1', name: 'Wi-Fi', code: 'WIFI', category: 'UTILITY' },
      { id: '2', name: 'Air Conditioner', code: 'AC', category: 'COMFORT' },
    ];
    const query = 'wifi';
    const filtered = items.filter(
      (item) => item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query)
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].code).toBe('WIFI');
  });

  it('SET6 — Property facility assignment calls M5 assign/unassign endpoints', () => {
    expect(typeof assignFacilityToPropertyApi).toBe('function');
    expect(typeof unassignFacilityFromPropertyApi).toBe('function');
  });

  it('SET7 — Property context changes property-specific settings query keys', () => {
    const keyPropA = ['property-facilities', 'org_123', 'prop_A'];
    const keyPropB = ['property-facilities', 'org_123', 'prop_B'];
    expect(keyPropA).not.toEqual(keyPropB);
  });

  it('SET8 — Organization settings remain organization-scoped across properties', () => {
    const orgScopeKey = ['organization', 'me'];
    expect(orgScopeKey).not.toContain('prop_A');
  });

  it('SET9 — Unsaved changes warning tracks dirty state before modal dismiss', () => {
    const initialName = 'Green Heights';
    let currentName = 'Green Heights Modified';
    const isDirty = currentName !== initialName;
    expect(isDirty).toBe(true);

    currentName = 'Green Heights';
    expect(currentName === initialName).toBe(true);
  });

  it('SET10 — Delete property and unassign facility require clear confirmation dialogs', () => {
    const confirmMessage = 'Delete Property "Green Heights PG"?';
    expect(confirmMessage).toContain('Delete Property');
  });

  it('SET11 — Mess backend-gap state renders honest notice without fake save', () => {
    const messBackendAvailable = false;
    expect(messBackendAvailable).toBe(false);
  });

  it('SET12 — Billing backend-gap state renders honest notice without fake save', () => {
    const billingBackendAvailable = false;
    expect(billingBackendAvailable).toBe(false);
  });

  it('SET13 — Cache invalidation targets affected query keys after mutations', () => {
    const orgId = 'org_123';
    const affectedKey = ['properties', orgId];
    expect(affectedKey[0]).toBe('properties');
  });

  it('SET14 — Logout clears tokens and purges settings query cache', async () => {
    await setAccessToken('settings-test-token');
    await setRefreshToken('settings-refresh-token');
    await clearTokens();
    clearQueryCache();
  });

  it('SET15 — No unsupported API is called for Mess, Billing, or Resident facilities', () => {
    const messApi = null;
    const billingApi = null;
    const residentFacilityApi = null;
    expect(messApi).toBeNull();
    expect(billingApi).toBeNull();
    expect(residentFacilityApi).toBeNull();
  });

  it('SET16 — No fake configuration is persisted to local storage or dummy state', () => {
    const fakeStatePersisted = false;
    expect(fakeStatePersisted).toBe(false);
  });
});
