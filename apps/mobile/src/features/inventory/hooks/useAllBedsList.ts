import { useQuery } from '@tanstack/react-query';
import type { BedDto } from '@m-square/contracts';
import { getPropertiesApi } from '../../properties/api/properties.api';
import { getBuildingsApi } from '../../buildings/api/buildings.api';
import { getFloorsApi } from '../../floors/api/floors.api';
import { getRoomsApi } from '../../rooms/api/rooms.api';
import { getBedsApi } from '../../beds/api/beds.api';
import { getResidentsApi } from '../../residents/api/residents.api';
import type { DisplayBedState } from '../components/BedIndicator';

export interface BedListItem {
  bed: BedDto;
  roomNumber: string;
  roomId: string;
  buildingName: string;
  floorName: string;
  propertyName?: string;
  state: DisplayBedState;
  occupantName?: string;
  residentId?: string;
}

export function useAllBedsList(
  propertyId: string | null,
  buildingId: string | null,
  floorId: string | null,
  searchQuery: string,
  filterStatus: string | null
) {
  return useQuery({
    queryKey: ['beds', 'all-list', propertyId, buildingId, floorId, searchQuery, filterStatus],
    queryFn: async (): Promise<BedListItem[]> => {
      // 1. Determine target property IDs
      let targetPropertyIds: string[] = [];
      if (propertyId) {
        targetPropertyIds = [propertyId];
      } else {
        const propsRes = await getPropertiesApi({ page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
        targetPropertyIds = (propsRes.items || []).map((p) => p.id);
      }

      if (targetPropertyIds.length === 0) return [];

      // 2. Fetch active residents for occupant mapping
      const resData = await getResidentsApi({ status: 'ACTIVE', page: 1, pageSize: 200 }).catch(() => ({ items: [] }));
      const occupantMap: Record<string, { name: string; residentId: string }> = {};
      (resData.items || []).forEach((r) => {
        if (r.currentLocation?.bedId) {
          occupantMap[r.currentLocation.bedId] = {
            name: `${r.firstName} ${r.lastName}`,
            residentId: r.id,
          };
        }
      });

      const result: BedListItem[] = [];

      for (const pId of targetPropertyIds) {
        try {
          const bRes = await getBuildingsApi(pId, { page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
          const buildings = buildingId ? (bRes.items || []).filter((b) => b.id === buildingId) : (bRes.items || []);

          for (const b of buildings) {
            const fRes = await getFloorsApi(b.id, { page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
            const floors = floorId ? (fRes.items || []).filter((f) => f.id === floorId) : (fRes.items || []);

            for (const f of floors) {
              const rRes = await getRoomsApi(f.id, { page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
              const rooms = rRes.items || [];

              for (const room of rooms) {
                const bedRes = await getBedsApi(room.id, { page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
                const beds = bedRes.items || [];

                for (const bed of beds) {
                  const occupant = occupantMap[bed.id];
                  let state: DisplayBedState = 'AVAILABLE';
                  if (occupant) {
                    state = 'OCCUPIED';
                  } else if (bed.status === 'MAINTENANCE') {
                    state = 'MAINTENANCE';
                  } else if (bed.status === 'INACTIVE') {
                    state = 'INACTIVE';
                  }

                  // Apply status filter if set
                  if (filterStatus && state !== filterStatus) {
                    continue;
                  }

                  // Apply search filter (bedNumber, roomNumber, or residentName)
                  if (searchQuery.trim()) {
                    const q = searchQuery.trim().toLowerCase();
                    const matchBed = bed.bedNumber.toLowerCase().includes(q);
                    const matchRoom = room.roomNumber.toLowerCase().includes(q);
                    const matchName = occupant?.name.toLowerCase().includes(q);

                    if (!matchBed && !matchRoom && !matchName) {
                      continue;
                    }
                  }

                  result.push({
                    bed,
                    roomNumber: room.roomNumber,
                    roomId: room.id,
                    buildingName: b.name,
                    floorName: f.name,
                    state,
                    occupantName: occupant?.name,
                    residentId: occupant?.residentId,
                  });
                }
              }
            }
          }
        } catch {
          // Continue with next property
        }
      }

      return result;
    },
    staleTime: 15 * 1000,
  });
}
