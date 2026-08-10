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

export class KyselyOrganizationRepository {
  constructor(private readonly db: Kysely<DatabaseSchema> | Transaction<DatabaseSchema>) {}

  public async createOrganization(data: CreateOrganizationData): Promise<OrganizationRow> {
    const row = await this.db
      .insertInto('organizations')
      .values({
        name: data.name,
        slug: data.slug.toLowerCase(),
        status: data.status ?? 'ACTIVE',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return this.mapOrganizationRow(row);
  }

  public async createMembership(organizationId: string, userId: string): Promise<MembershipRow> {
    const row = await this.db
      .insertInto('organization_memberships')
      .values({
        organization_id: organizationId,
        user_id: userId,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      createdAt: new Date(row.created_at),
    };
  }

  public async findById(id: string): Promise<OrganizationRow | null> {
    const row = await this.db
      .selectFrom('organizations')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return row ? this.mapOrganizationRow(row) : null;
  }

  public async findByUserId(
    userId: string
  ): Promise<{ organization: OrganizationRow; membership: MembershipRow } | null> {
    const row = await this.db
      .selectFrom('organization_memberships')
      .innerJoin('organizations', 'organizations.id', 'organization_memberships.organization_id')
      .select([
        'organizations.id as org_id',
        'organizations.name as org_name',
        'organizations.slug as org_slug',
        'organizations.status as org_status',
        'organizations.created_at as org_created_at',
        'organizations.updated_at as org_updated_at',
        'organization_memberships.id as mem_id',
        'organization_memberships.organization_id as mem_org_id',
        'organization_memberships.user_id as mem_user_id',
        'organization_memberships.created_at as mem_created_at',
      ])
      .where('organization_memberships.user_id', '=', userId)
      .executeTakeFirst();

    if (!row) return null;

    return {
      organization: {
        id: row.org_id,
        name: row.org_name,
        slug: row.org_slug,
        status: row.org_status as OrganizationStatus,
        createdAt: new Date(row.org_created_at),
        updatedAt: new Date(row.org_updated_at),
      },
      membership: {
        id: row.mem_id,
        organizationId: row.mem_org_id,
        userId: row.mem_user_id,
        createdAt: new Date(row.mem_created_at),
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapOrganizationRow(row: any): OrganizationRow {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status as OrganizationStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
