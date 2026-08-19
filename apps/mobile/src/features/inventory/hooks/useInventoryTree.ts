import { useQuery } from '@tanstack/react-query';
import type { BedDto, BuildingDto, FacilityDto, FloorDto, RoomDto } from '@m-square/contracts';
import { getBuildingsApi } from '../../buildings/api/buildings.api';
import { getFloorsApi } from '../../floors/api/floors.api';
import { getRoomsApi } from '../../rooms/api/rooms.api';
import { getBedsApi } from '../../beds/api/beds.api';
import { getResidentsApi } from '../../residents/api/residents.api';
import { getRoomFacilitiesApi } from '../../facilities/api/facilities.api';

export interface RoomWithBedsAndFacilities {
  room: RoomDto;
  beds: BedDto[];
  facilities?: FacilityDto[];
}

export interface FloorWithRooms {
  floor: FloorDto;
  rooms: RoomWithBedsAndFacilities[];
}

export interface InventoryTreeData {
  buildings: BuildingDto[];
  floors: FloorDto[];
  floorMap: FloorWithRooms[];
  occupantMap: Record<string, string>; // bedId -> residentFullName
  summary: {
    totalBeds: number;
    occupiedCount: number;
    availableCount: number;
    maintenanceCount: number;
  };
}

export function useInventoryTree(
  propertyId: string | null,
  selectedBuildingId: string | null,
  selectedFloorId: string | null
) {
  return useQuery({
    queryKey: ['inventory', 'tree', propertyId, selectedBuildingId, selectedFloorId],
    queryFn: async (): Promise<InventoryTreeData> => {
      if (!propertyId) {
        return {
          buildings: [],
          floors: [],
          floorMap: [],
          occupantMap: {},
          summary: { totalBeds: 0, occupiedCount: 0, availableCount: 0, maintenanceCount: 0 },
        };
      }

      // 1. Fetch buildings for property
      const bRes = await getBuildingsApi(propertyId, { page: 1, pageSize: 50 });
      const buildings = bRes.items || [];

      const activeBuildingId =
        selectedBuildingId || (buildings.length > 0 ? buildings[0].id : null);

      if (!activeBuildingId) {
        return {
          buildings,
          floors: [],
          floorMap: [],
          occupantMap: {},
          summary: { totalBeds: 0, occupiedCount: 0, availableCount: 0, maintenanceCount: 0 },
        };
      }

      // 2. Fetch floors for building
      const fRes = await getFloorsApi(activeBuildingId, { page: 1, pageSize: 50 });
      const floors = fRes.items || [];

      const activeFloors = selectedFloorId
        ? floors.filter((f) => f.id === selectedFloorId)
        : floors;

      // 3. Fetch active residents for occupant mapping
      const resData = await getResidentsApi({ status: 'ACTIVE', page: 1, pageSize: 100 });
      const occupantMap: Record<string, string> = {};
      (resData.items || []).forEach((r) => {
        if (r.currentLocation?.bedId) {
          occupantMap[r.currentLocation.bedId] = `${r.firstName} ${r.lastName}`;
        }
      });

      // 4. Fetch rooms & beds & facilities for active floors
      const floorMap: FloorWithRooms[] = [];
      let totalBeds = 0;
      let occupiedCount = 0;
      let availableCount = 0;
      let maintenanceCount = 0;

      for (const floor of activeFloors) {
        const roomRes = await getRoomsApi(floor.id, { page: 1, pageSize: 50 });
        const rooms = roomRes.items || [];

        const roomBedsList: RoomWithBedsAndFacilities[] = [];

        for (const room of rooms) {
          const [bedRes, facRes] = await Promise.all([
            getBedsApi(room.id, { page: 1, pageSize: 50 }).catch(() => ({ items: [] })),
            getRoomFacilitiesApi(room.id).catch(() => []),
          ]);
          const beds = bedRes.items || [];
          const facilities = facRes || [];

          beds.forEach((b) => {
            totalBeds += 1;
            if (occupantMap[b.id] || b.status === 'OCCUPIED') {
              occupiedCount += 1;
            } else if (b.status === 'MAINTENANCE') {
              maintenanceCount += 1;
            } else if (b.status === 'AVAILABLE') {
              availableCount += 1;
            }
          });

          roomBedsList.push({ room, beds, facilities });
        }

        floorMap.push({ floor, rooms: roomBedsList });
      }

      return {
        buildings,
        floors,
        floorMap,
        occupantMap,
        summary: { totalBeds, occupiedCount, availableCount, maintenanceCount },
      };
    },
    enabled: !!propertyId,
    staleTime: 15 * 1000,
  });
}
