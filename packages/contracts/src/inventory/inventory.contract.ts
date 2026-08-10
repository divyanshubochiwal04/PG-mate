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

export interface BedDto {
  id: string;
  roomId: string;
  organizationId: string;
  bedNumber: string;
  displayOrder: number;
  status: 'AVAILABLE' | 'INACTIVE' | 'MAINTENANCE';
  createdAt: string;
  updatedAt: string;
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
