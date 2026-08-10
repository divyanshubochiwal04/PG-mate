import { describe, expect, it } from 'vitest';
import { InventoryService } from '../modules/inventory/inventory.service';

describe('apps/api - InventoryService', () => {
  it('should instantiate InventoryService correctly', () => {
    const service = new InventoryService();
    expect(service).toBeDefined();
  });
});
