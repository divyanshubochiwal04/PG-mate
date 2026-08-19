export declare class BuildingInfoConfigDto {
  name: string;
  code: string;
  displayOrder?: number;
}
export declare class RoomSetupItemDto {
  roomNumber: string;
  roomType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY' | 'CUSTOM';
  capacity: number;
  facilityIds?: string[];
}
export declare class FloorSetupItemDto {
  name: string;
  floorNumber: number;
  displayOrder?: number;
  rooms: RoomSetupItemDto[];
}
export declare class CreateBuildingSetupDto {
  propertyId: string;
  building: BuildingInfoConfigDto;
  floors: FloorSetupItemDto[];
}
//# sourceMappingURL=create-building-setup.dto.d.ts.map
