import { describe, expect, it, vi } from 'vitest';
import { InventoryService } from '../modules/inventory/inventory.service';

describe('apps/api - InventoryService', () => {
  it('should instantiate InventoryService correctly', () => {
    const mockPropertyBuildingService = vi.fn() as never;
    const mockFloorRoomBedService = vi.fn() as never;
    const mockFacilityService = vi.fn() as never;

    const service = new InventoryService(
      mockPropertyBuildingService,
      mockFloorRoomBedService,
      mockFacilityService
    );
    expect(service).toBeDefined();
  });
});
