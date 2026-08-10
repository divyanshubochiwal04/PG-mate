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

export type DatabaseSchema = AuthDatabaseSchema & TenantDatabaseSchema & InventoryDatabaseSchema;
