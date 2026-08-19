export interface OrganizationDto {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
}
export interface OrganizationMembershipDto {
    id: string;
    organizationId: string;
    userId: string;
    createdAt: string;
}
//# sourceMappingURL=tenant.contract.d.ts.map