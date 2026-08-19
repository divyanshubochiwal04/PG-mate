import type { Generated } from 'kysely';
export interface OrganizationCountersTable {
    id: Generated<string>;
    organization_id: string;
    counter_type: string;
    current_value: Generated<number>;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface ResidentsTable {
    id: Generated<string>;
    organization_id: string;
    resident_code: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    preferred_name: string | null;
    date_of_birth: Date | null;
    gender: string;
    phone: string;
    alternate_phone: string | null;
    email: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    status: Generated<string>;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface EmergencyContactsTable {
    id: Generated<string>;
    resident_id: string;
    organization_id: string;
    name: string;
    relationship: string;
    phone: string;
    alternate_phone: string | null;
    is_primary: Generated<boolean>;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface StaysTable {
    id: Generated<string>;
    organization_id: string;
    resident_id: string;
    admission_date: Generated<Date>;
    expected_checkout_date: Date | null;
    actual_checkout_date: Date | null;
    status: Generated<string>;
    notes: string | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface BedAllocationsTable {
    id: Generated<string>;
    organization_id: string;
    stay_id: string;
    bed_id: string;
    start_at: Generated<Date>;
    end_at: Date | null;
    status: Generated<string>;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
//# sourceMappingURL=resident-allocation.schema.d.ts.map