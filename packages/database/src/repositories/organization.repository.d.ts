import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../schema/combined.schema';
import type { OrganizationStatus } from '@m-square/domain';
export interface CreateOrganizationData {
    name: string;
    slug: string;
    status?: OrganizationStatus;
}
export interface OrganizationRow {
    id: string;
    name: string;
    slug: string;
    status: OrganizationStatus;
    createdAt: Date;
    updatedAt: Date;
}
export interface MembershipRow {
    id: string;
    organizationId: string;
    userId: string;
    createdAt: Date;
}
export declare class KyselyOrganizationRepository {
    private readonly db;
    constructor(db: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>);
    createOrganization(data: CreateOrganizationData): Promise<OrganizationRow>;
    createMembership(organizationId: string, userId: string): Promise<MembershipRow>;
    findById(id: string): Promise<OrganizationRow | null>;
    findByUserId(userId: string): Promise<{
        organization: OrganizationRow;
        membership: MembershipRow;
    } | null>;
    private mapOrganizationRow;
}
//# sourceMappingURL=organization.repository.d.ts.map