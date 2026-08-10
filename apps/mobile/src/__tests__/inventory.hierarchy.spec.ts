import { describe, expect, it } from 'vitest';
import { createBuildingApi, getBuildingsApi } from '../features/buildings/api/buildings.api';
import { createFloorApi, getFloorsApi } from '../features/floors/api/floors.api';
import { createRoomApi, getRoomsApi, updateRoomCapacityApi } from '../features/rooms/api/rooms.api';
import { createBedApi, getBedsApi, updateBedStatusApi } from '../features/beds/api/beds.api';
import { assignFacilityToPropertyApi, getFacilitiesApi } from '../features/facilities/api/facilities.api';

describe('apps/mobile — Physical Inventory Hierarchy API Features', () => {
  it('I1 — should expose Building API functions', () => {
    expect(typeof getBuildingsApi).toBe('function');
    expect(typeof createBuildingApi).toBe('function');
  });

  it('I2 — should expose Floor API functions', () => {
    expect(typeof getFloorsApi).toBe('function');
    expect(typeof createFloorApi).toBe('function');
  });

  it('I3 — should expose Room API functions & capacity update', () => {
    expect(typeof getRoomsApi).toBe('function');
    expect(typeof createRoomApi).toBe('function');
    expect(typeof updateRoomCapacityApi).toBe('function');
  });

  it('I4 — should expose Bed API functions & status update', () => {
    expect(typeof getBedsApi).toBe('function');
    expect(typeof createBedApi).toBe('function');
    expect(typeof updateBedStatusApi).toBe('function');
  });

  it('I5 — should expose Facility API functions & assignment', () => {
    expect(typeof getFacilitiesApi).toBe('function');
    expect(typeof assignFacilityToPropertyApi).toBe('function');
  });
});
