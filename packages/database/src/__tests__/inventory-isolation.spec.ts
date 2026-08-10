import { describe, expect, it } from 'vitest';
import { KyselyBedRepository } from '../repositories/bed.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';

describe('packages/database - M5 Inventory Domain & Isolation', () => {
  it('should instantiate inventory repositories correctly', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomRepo = new KyselyRoomRepository({} as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bedRepo = new KyselyBedRepository({} as any);

    expect(roomRepo).toBeDefined();
    expect(bedRepo).toBeDefined();
  });
});
