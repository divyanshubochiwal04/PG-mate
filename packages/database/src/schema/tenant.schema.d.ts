import type { Generated } from 'kysely';
export interface OrganizationsTable {
    id: Generated<string>;
    name: string;
    slug: string;
    status: string;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export interface OrganizationMembershipsTable {
    id: Generated<string>;
    organization_id: string;
    user_id: string;
    created_at: Generated<Date>;
}
export interface TenantDatabaseSchema {
    organizations: OrganizationsTable;
    organization_memberships: OrganizationMembershipsTable;
}
//# sourceMappingURL=tenant.schema.d.ts.map