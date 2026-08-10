export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type ResidentStatus = 'ACTIVE' | 'INACTIVE';
export type EmergencyRelationship =
  | 'PARENT'
  | 'GUARDIAN'
  | 'SIBLING'
  | 'SPOUSE'
  | 'FRIEND'
  | 'OTHER';
export type StayStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type AllocationStatus = 'ACTIVE' | 'ENDED' | 'CANCELLED';

export interface EmergencyContactDto {
  id: string;
  residentId: string;
  organizationId: string;
  name: string;
  relationship: EmergencyRelationship;
  phone: string;
  alternatePhone?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentLocationDto {
  propertyId: string;
  propertyName: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  roomId: string;
  roomNumber: string;
  bedId: string;
  bedNumber: string;
  allocationId: string;
  stayId: string;
}

export interface ResidentDto {
  id: string;
  organizationId: string;
  residentCode: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  preferredName?: string | null;
  dateOfBirth?: string | null;
  gender: Gender;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  status: ResidentStatus;
  primaryEmergencyContact?: EmergencyContactDto | null;
  currentLocation?: CurrentLocationDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface StayDto {
  id: string;
  organizationId: string;
  residentId: string;
  admissionDate: string;
  expectedCheckoutDate?: string | null;
  actualCheckoutDate?: string | null;
  status: StayStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BedAllocationDto {
  id: string;
  organizationId: string;
  stayId: string;
  bedId: string;
  startAt: string;
  endAt?: string | null;
  status: AllocationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentHistoryDto {
  resident: ResidentDto;
  stays: StayDto[];
  allocations: BedAllocationDto[];
}
