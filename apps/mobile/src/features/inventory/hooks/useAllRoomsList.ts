import { useQuery } from '@tanstack/react-query';
import type { BedDto, RoomDto } from '@m-square/contracts';
import { getPropertiesApi } from '../../properties/api/properties.api';
import { getBuildingsApi } from '../../buildings/api/buildings.api';
import { getFloorsApi } from '../../floors/api/floors.api';
import { getRoomsApi } from '../../rooms/api/rooms.api';
import { getBedsApi } from '../../beds/api/beds.api';
import { getResidentsApi } from '../../residents/api/residents.api';

export interface RoomListItem {
  room: RoomDto;
  buildingName: string;
  floorName: string;
  propertyName?: string;
  beds: BedDto[];
  occupiedCount: number;
  availableCount: number;
}

export function useAllRoomsList(
  propertyId: string | null,
  buildingId: string | null,
  floorId: string | null,
  searchRoomNumber: string
) {
  return useQuery({
    queryKey: ['rooms', 'all-list', propertyId, buildingId, floorId, searchRoomNumber],
    queryFn: async (): Promise<RoomListItem[]> => {
      // 1. Determine target property IDs
      let targetPropertyIds: string[] = [];
      if (propertyId) {
        targetPropertyIds = [propertyId];
      } else {
        const propsRes = await getPropertiesApi({ page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
        targetPropertyIds = (propsRes.items || []).map((p) => p.id);
      }

      if (targetPropertyIds.length === 0) return [];

      const resData = await getResidentsApi({ status: 'ACTIVE', page: 1, pageSize: 200 }).catch(() => ({ items: [] }));
      const occupantMap: Record<string, string> = {};
      (resData.items || []).forEach((r) => {
        if (r.currentLocation?.bedId) {
          occupantMap[r.currentLocation.bedId] = `${r.firstName} ${r.lastName}`;
        }
      });

      const result: RoomListItem[] = [];

      for (const pId of targetPropertyIds) {
        try {
          const bRes = await getBuildingsApi(pId, { page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
          const buildings = buildingId ? (bRes.items || []).filter((b) => b.id === buildingId) : (bRes.items || []);

          for (const b of buildings) {
            const fRes = await getFloorsApi(b.id, { page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
            const floors = floorId ? (fRes.items || []).filter((f) => f.id === floorId) : (fRes.items || []);

            for (const f of floors) {
              const rRes = await getRoomsApi(f.id, { page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
              let rooms = rRes.items || [];

              if (searchRoomNumber.trim()) {
                rooms = rooms.filter((r) =>
                  r.roomNumber.toLowerCase().includes(searchRoomNumber.trim().toLowerCase())
                );
              }

              for (const room of rooms) {
                const bedRes = await getBedsApi(room.id, { page: 1, pageSize: 50 }).catch(() => ({ items: [] }));
                const beds = bedRes.items || [];

                const occupiedCount = beds.filter((bed) => occupantMap[bed.id]).length;
                const availableCount = beds.filter(
                  (bed) => bed.status === 'AVAILABLE' && !occupantMap[bed.id]
                ).length;

                result.push({
                  room,
                  buildingName: b.name,
                  floorName: f.name,
                  beds,
                  occupiedCount,
                  availableCount,
                });
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
