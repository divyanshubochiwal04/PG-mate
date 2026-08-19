import type { BuildingSetupResultDto } from '@m-square/contracts';
import {
  KyselyBedRepository,
  KyselyBuildingRepository,
  KyselyFacilityRepository,
  KyselyFloorRepository,
  KyselyPropertyRepository,
  KyselyRoomRepository,
  KyselyUnitOfWork,
} from '@m-square/database';
import type { CreateBuildingSetupDto } from '../dto/create-building-setup.dto';
export declare class BuildingSetupService {
  private readonly unitOfWork;
  private readonly propertyRepo;
  private readonly buildingRepo;
  private readonly floorRepo;
  private readonly roomRepo;
  private readonly bedRepo;
  private readonly facilityRepo;
  constructor(
    unitOfWork: KyselyUnitOfWork,
    propertyRepo: KyselyPropertyRepository,
    buildingRepo: KyselyBuildingRepository,
    floorRepo: KyselyFloorRepository,
    roomRepo: KyselyRoomRepository,
    bedRepo: KyselyBedRepository,
    facilityRepo: KyselyFacilityRepository
  );
  setupBuilding(
    organizationId: string,
    dto: CreateBuildingSetupDto
  ): Promise<BuildingSetupResultDto>;
}
//# sourceMappingURL=building-setup.service.d.ts.map
