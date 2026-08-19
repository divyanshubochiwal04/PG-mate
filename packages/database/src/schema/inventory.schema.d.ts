import type { Generated } from 'kysely';
export interface PropertiesTable {
    id: Generated<string>;
    organization_id: string;
    name: string;
    code: string;
    address_line1: string;
    address_line2: string | null;
    locality: string;
    city: string;
    state: string;
    postal_code: string;
    status: string;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface BuildingsTable {
    id: Generated<string>;
    property_id: string;
    organization_id: string;
    name: string;
    code: string;
    display_order: Generated<number>;
    status: string;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface FloorsTable {
    id: Generated<string>;
    building_id: string;
    organization_id: string;
    name: string;
    floor_number: number;
    display_order: Generated<number>;
    status: string;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface RoomsTable {
    id: Generated<string>;
    floor_id: string;
    building_id: string;
    property_id: string;
    organization_id: string;
    room_number: string;
    room_type: string;
    capacity: number;
    display_order: Generated<number>;
    status: string;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface BedsTable {
    id: Generated<string>;
    room_id: string;
    organization_id: string;
    bed_number: string;
    display_order: Generated<number>;
    status: string;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface FacilitiesTable {
    id: Generated<string>;
    organization_id: string;
    name: string;
    code: string;
    category: string;
    description: string | null;
    status: string;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface PropertyFacilitiesTable {
    id: Generated<string>;
    property_id: string;
    facility_id: string;
    organization_id: string;
    created_at: Generated<Date>;
}
export interface BuildingFacilitiesTable {
    id: Generated<string>;
    building_id: string;
    facility_id: string;
    organization_id: string;
    created_at: Generated<Date>;
}
export interface RoomFacilitiesTable {
    id: Generated<string>;
    room_id: string;
    facility_id: string;
    organization_id: string;
    created_at: Generated<Date>;
}
//# sourceMappingURL=inventory.schema.d.ts.map