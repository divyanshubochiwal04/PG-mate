import type { AuthDatabaseSchema } from './auth.schema';
import type { TenantDatabaseSchema } from './tenant.schema';
import type {
  BedsTable,
  BuildingFacilitiesTable,
  BuildingsTable,
  FacilitiesTable,
  FloorsTable,
  PropertiesTable,
  PropertyFacilitiesTable,
  RoomFacilitiesTable,
  RoomsTable,
} from './inventory.schema';
import type {
  BedAllocationsTable,
  EmergencyContactsTable,
  OrganizationCountersTable,
  ResidentsTable,
  StaysTable,
} from './resident-allocation.schema';

export interface InventoryDatabaseSchema {
  properties: PropertiesTable;
  buildings: BuildingsTable;
  floors: FloorsTable;
  rooms: RoomsTable;
  beds: BedsTable;
  facilities: FacilitiesTable;
  property_facilities: PropertyFacilitiesTable;
  building_facilities: BuildingFacilitiesTable;
  room_facilities: RoomFacilitiesTable;
}

export interface ResidentDatabaseSchema {
  organization_counters: OrganizationCountersTable;
  residents: ResidentsTable;
  emergency_contacts: EmergencyContactsTable;
  stays: StaysTable;
  bed_allocations: BedAllocationsTable;
}

export type DatabaseSchema = AuthDatabaseSchema &
  TenantDatabaseSchema &
  InventoryDatabaseSchema &
  ResidentDatabaseSchema;
