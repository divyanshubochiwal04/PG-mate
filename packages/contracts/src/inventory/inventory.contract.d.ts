export interface PropertyAddressDto {
    addressLine1: string;
    addressLine2?: string | null;
    locality: string;
    city: string;
    state: string;
    postalCode: string;
}
export interface PropertyDto {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    address: PropertyAddressDto;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}
export interface BuildingDto {
    id: string;
    propertyId: string;
    organizationId: string;
    name: string;
    code: string;
    displayOrder: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}
export interface FloorDto {
    id: string;
    buildingId: string;
    organizationId: string;
    name: string;
    floorNumber: number;
    displayOrder: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}
export interface RoomDto {
    id: string;
    floorId: string;
    buildingId: string;
    propertyId: string;
    organizationId: string;
    roomNumber: string;
    roomType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY' | 'CUSTOM';
    capacity: number;
    displayOrder: number;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    createdAt: string;
    updatedAt: string;
}
export interface BedOccupantDto {
    residentId: string;
    stayId: string;
    fullName: string;
    phone?: string | null;
}
export interface BedDto {
    id: string;
    roomId: string;
    organizationId: string;
    bedNumber: string;
    displayOrder: number;
    status: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE' | 'OCCUPIED';
    createdAt: string;
    updatedAt: string;
    activeResident?: BedOccupantDto | null;
}
export interface FacilityDto {
    id: string;
    organizationId: string;
    name: string;
    code: string;
    category: 'GENERAL' | 'UTILITY' | 'SAFETY' | 'COMFORT';
    description?: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}
export interface RoomSetupConfigDto {
    roomNumber: string;
    roomType?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY' | 'CUSTOM';
    capacity: number;
    facilityIds?: string[];
}
export interface FloorSetupConfigDto {
    name: string;
    floorNumber: number;
    displayOrder?: number;
    rooms: RoomSetupConfigDto[];
}
export interface CreateBuildingSetupDataDto {
    propertyId: string;
    building: {
        name: string;
        code: string;
        displayOrder?: number;
    };
    floors: FloorSetupConfigDto[];
}
export interface BuildingSetupResultDto {
    building: BuildingDto;
    floorsCount: number;
    roomsCount: number;
    bedsCount: number;
    assignedFacilitiesCount: number;
    floors: FloorDto[];
}
export interface RoomOccupancySummaryDto {
    id: string;
    roomNumber: string;
    roomType: string;
    capacity: number;
    status: string;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyPercentage: number;
    facilities: FacilityDto[];
    beds: BedDto[];
}
export interface FloorOccupancySummaryDto {
    id: string;
    name: string;
    floorNumber: number;
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyPercentage: number;
    rooms: RoomOccupancySummaryDto[];
}
export interface BuildingOccupancyTreeDto {
    buildingId: string;
    buildingName: string;
    buildingCode: string;
    propertyName: string;
    propertyId: string;
    totalFloors: number;
    totalRooms: number;
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyPercentage: number;
    floors: FloorOccupancySummaryDto[];
}
export interface MessConfigurationSummaryDto {
    totalMesses: number;
    activeMealPlans: number;
    activeSubscribers: number;
}
export interface BillingConfigurationSummaryDto {
    defaultBillingCycle: string;
    invoiceDueDays: number;
    gracePeriodDays: number;
    lateFeeEnabled: boolean;
}
export interface InventoryConfigurationSummaryDto {
    defaultReorderLevel: number;
    defaultMinimumStock: number;
    totalCategories: number;
}
export interface OperationalConfigurationSummaryDto {
    properties: PropertyDto[];
    buildingsCount: number;
    floorsCount: number;
    roomsCount: number;
    bedsCount: number;
    messOverview: MessConfigurationSummaryDto;
    billingDefaults: BillingConfigurationSummaryDto;
    inventoryDefaults: InventoryConfigurationSummaryDto;
}
//# sourceMappingURL=inventory.contract.d.ts.map