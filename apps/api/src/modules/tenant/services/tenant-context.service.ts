import { Injectable } from '@nestjs/common';
import { dbService, KyselyOrganizationRepository } from '@m-square/database';
import type { OrganizationStatus } from '@m-square/domain';

export interface OrganizationContext {
  organizationId: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
}

@Injectable()
export class TenantContextService {
  public async resolveForUser(userId: string): Promise<OrganizationContext | null> {
    const orgRepo = new KyselyOrganizationRepository(dbService.db);
    const result = await orgRepo.findByUserId(userId);

    if (!result) {
      return null;
    }

    return {
      organizationId: result.organization.id,
      name: result.organization.name,
      slug: result.organization.slug,
      status: result.organization.status,
    };
  }
}
