import { dbService } from '../connection/database';
import { KyselyOrganizationRepository } from '../repositories/organization.repository';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyBuildingRepository } from '../repositories/building.repository';
import { KyselyFloorRepository } from '../repositories/floor.repository';
import { KyselyRoomRepository } from '../repositories/room.repository';
import { KyselyBedRepository } from '../repositories/bed.repository';
import { KyselyFacilityRepository } from '../repositories/facility.repository';
import { KyselyUnitOfWork } from '../transactions/unit-of-work';

// We import BuildingSetupService directly from api module
import { BuildingSetupService } from '../../../../apps/api/src/modules/inventory/services/building-setup.service';
import type { CreateBuildingSetupDto } from '../../../../apps/api/src/modules/inventory/dto/create-building-setup.dto';

async function runBuildingSetupE2EVerification() {
  console.log('🚀 Starting Physical PostgreSQL Building Setup Wizard E2E Verification...');

  const db = dbService.db;

  const orgRepo = new KyselyOrganizationRepository(db);
  const propertyRepo = new KyselyPropertyRepository(db);
  const buildingRepo = new KyselyBuildingRepository(db);
  const floorRepo = new KyselyFloorRepository(db);
  const roomRepo = new KyselyRoomRepository(db);
  const bedRepo = new KyselyBedRepository(db);
  const facilityRepo = new KyselyFacilityRepository(db);
  const unitOfWork = new KyselyUnitOfWork(db);

  const setupService = new BuildingSetupService(
    unitOfWork as any,
    propertyRepo as any,
    buildingRepo as any,
    floorRepo as any,
    roomRepo as any,
    bedRepo as any,
    facilityRepo as any
  );

  const suffix = Date.now().toString().slice(-6);

  // 1. Scaffold Org A and Org B
  const orgA = await orgRepo.createOrganization({
    name: `Setup E2E Org A ${suffix}`,
    slug: `setup-org-a-${suffix}`,
  });

  const orgB = await orgRepo.createOrganization({
    name: `Setup E2E Org B ${suffix}`,
    slug: `setup-org-b-${suffix}`,
  });

  const propA = await propertyRepo.createForOrganization(orgA.id, {
    name: `Property A ${suffix}`,
    code: `PROP-A-${suffix}`,
    addressLine1: 'Line 1',
    locality: 'Loc A',
    city: 'City A',
    state: 'State A',
    postalCode: '302001',
  });

  const propB = await propertyRepo.createForOrganization(orgB.id, {
    name: `Property B ${suffix}`,
    code: `PROP-B-${suffix}`,
    addressLine1: 'Line 1',
    locality: 'Loc B',
    city: 'City B',
    state: 'State B',
    postalCode: '302002',
  });

  const facA1 = await facilityRepo.createForOrganization(orgA.id, {
    name: `HighSpeed WiFi ${suffix}`,
    code: `WIFI-${suffix}`,
    category: 'UTILITY',
  });

  const facA2 = await facilityRepo.createForOrganization(orgA.id, {
    name: `Ceiling Fan ${suffix}`,
    code: `FAN-${suffix}`,
    category: 'GENERAL',
  });

  const facB1 = await facilityRepo.createForOrganization(orgB.id, {
    name: `Org B AC ${suffix}`,
    code: `AC-${suffix}`,
    category: 'COMFORT',
  });

  console.log(`✅ Scaffold complete: orgA=${orgA.id} propA=${propA.id} facA1=${facA1.id}`);

  // 2. Scenario 1 — Successful Bulk Setup
  const setupPayload: CreateBuildingSetupDto = {
    propertyId: propA.id,
    building: {
      name: `Block A ${suffix}`,
      code: `BLK-A-${suffix}`,
      displayOrder: 1,
    },
    floors: [
      {
        name: 'Ground Floor',
        floorNumber: 0,
        rooms: [
          {
            roomNumber: `101-${suffix}`,
            roomType: 'DOUBLE',
            capacity: 2,
            facilityIds: [facA1.id, facA2.id],
          },
          {
            roomNumber: `102-${suffix}`,
            roomType: 'DOUBLE',
            capacity: 2,
            facilityIds: [facA1.id, facA2.id],
          },
        ],
      },
      {
        name: '1st Floor',
        floorNumber: 1,
        rooms: [
          { roomNumber: `201-${suffix}`, roomType: 'TRIPLE', capacity: 3, facilityIds: [facA1.id] },
          { roomNumber: `202-${suffix}`, roomType: 'TRIPLE', capacity: 3, facilityIds: [facA1.id] },
        ],
      },
    ],
  };

  const setupResult = await setupService.setupBuilding(orgA.id, setupPayload);

  console.log(`✅ Bulk Setup Executed: buildingId=${setupResult.building.id}`);
  console.log(
    `   Counts: floors=${setupResult.floorsCount}, rooms=${setupResult.roomsCount}, beds=${setupResult.bedsCount}, facilities=${setupResult.assignedFacilitiesCount}`
  );

  // Assertions on result
  if (
    setupResult.floorsCount !== 2 ||
    setupResult.roomsCount !== 4 ||
    setupResult.bedsCount !== 10 ||
    setupResult.assignedFacilitiesCount !== 6
  ) {
    throw new Error(`Bulk setup returned incorrect counts: ${JSON.stringify(setupResult)}`);
  }

  // Direct PostgreSQL query verification
  const persistedBuilding = await buildingRepo.findByIdForOrganization(
    setupResult.building.id,
    orgA.id
  );
  if (!persistedBuilding || persistedBuilding.name !== `Block A ${suffix}`) {
    throw new Error('Building row not persisted correctly in PostgreSQL');
  }

  const persistedFloors = await floorRepo.findAllByBuilding(setupResult.building.id, orgA.id, {
    page: 1,
    pageSize: 10,
  });
  if (persistedFloors.pagination.total !== 2) {
    throw new Error(`Expected 2 floors in PostgreSQL, found ${persistedFloors.pagination.total}`);
  }

  const gFloor = persistedFloors.items.find((f) => f.floor_number === 0);
  if (!gFloor) throw new Error('Ground floor row not found');

  const gRooms = await roomRepo.findAllByFloor(gFloor.id, orgA.id, { page: 1, pageSize: 10 });
  if (gRooms.pagination.total !== 2) throw new Error('Ground floor rooms count mismatch');

  const r101 = gRooms.items.find((r) => r.room_number === `101-${suffix}`);
  if (!r101) throw new Error('Room 101 row not found');

  const r101Beds = await roomRepo.countBedsInRoom(r101.id, orgA.id);
  if (r101Beds !== 2) throw new Error(`Room 101 expected 2 beds, found ${r101Beds}`);

  const r101Facilities = await facilityRepo.findAssignedToRoom(r101.id, orgA.id);
  if (r101Facilities.length !== 2)
    throw new Error(`Room 101 expected 2 assigned facilities, found ${r101Facilities.length}`);

  console.log('✅ Direct PostgreSQL Hierarchy Queries Verified: 100% Correct');

  // 3. Scenario 2 — Duplicate Building Code Protection
  let duplicateBuildingRejected = false;
  try {
    await setupService.setupBuilding(orgA.id, setupPayload);
  } catch {
    duplicateBuildingRejected = true;
  }
  if (!duplicateBuildingRejected) throw new Error('Duplicate building code was not rejected!');
  console.log('✅ Duplicate Building Code Protection Verified');

  // 4. Scenario 3 — Duplicate Room Number Protection
  let duplicateRoomRejected = false;
  try {
    await setupService.setupBuilding(orgA.id, {
      ...setupPayload,
      building: { name: `Block B ${suffix}`, code: `BLK-B-${suffix}` },
      floors: [
        {
          name: 'Floor 1',
          floorNumber: 1,
          rooms: [
            { roomNumber: `101-${suffix}`, capacity: 2 },
            { roomNumber: `101-${suffix}`, capacity: 2 }, // Duplicate!
          ],
        },
      ],
    });
  } catch {
    duplicateRoomRejected = true;
  }
  if (!duplicateRoomRejected)
    throw new Error('Duplicate room number in setup request was not rejected!');
  console.log('✅ Duplicate Room Number Protection Verified');

  // 5. Scenario 4 — Cross-Tenant Property Protection
  let crossTenantPropertyRejected = false;
  try {
    await setupService.setupBuilding(orgA.id, {
      ...setupPayload,
      propertyId: propB.id, // Belong to Org B!
      building: { name: `Block C ${suffix}`, code: `BLK-C-${suffix}` },
    });
  } catch {
    crossTenantPropertyRejected = true;
  }
  if (!crossTenantPropertyRejected)
    throw new Error('Cross-tenant property access was not rejected!');
  console.log('✅ Cross-Tenant Property Protection Verified');

  // 6. Scenario 5 — Cross-Tenant Facility Protection
  let crossTenantFacilityRejected = false;
  try {
    await setupService.setupBuilding(orgA.id, {
      ...setupPayload,
      building: { name: `Block D ${suffix}`, code: `BLK-D-${suffix}` },
      floors: [
        {
          name: 'Floor 1',
          floorNumber: 1,
          rooms: [
            { roomNumber: `901-${suffix}`, capacity: 2, facilityIds: [facB1.id] }, // Belongs to Org B!
          ],
        },
      ],
    });
  } catch {
    crossTenantFacilityRejected = true;
  }
  if (!crossTenantFacilityRejected)
    throw new Error('Cross-tenant facility assignment was not rejected!');
  console.log('✅ Cross-Tenant Facility Protection Verified');

  // 7. Scenario 6 — Transactional Rollback Verification
  const failingBuildingCode = `FAIL-${suffix}`;
  let rollbackExceptionCaught = false;

  try {
    await unitOfWork.runInTransaction(async (trx) => {
      const bldg = await buildingRepo.createForOrganization(
        orgA.id,
        { propertyId: propA.id, name: 'Will Rollback Building', code: failingBuildingCode },
        trx
      );
      await floorRepo.createForOrganization(
        orgA.id,
        { buildingId: bldg.id, name: 'Will Rollback Floor', floorNumber: 1 },
        trx
      );
      // Simulate forced mid-transaction failure
      throw new Error('Simulated atomic transaction failure during room creation');
    });
  } catch {
    rollbackExceptionCaught = true;
  }

  if (!rollbackExceptionCaught) throw new Error('Simulated transaction error was not caught!');

  // Query PostgreSQL directly for failingBuildingCode -> MUST BE NULL (0 rows)
  const queryAllBuildings = await buildingRepo.findAllByProperty(propA.id, orgA.id, {
    page: 1,
    pageSize: 100,
  });
  const rolledBackBuilding = queryAllBuildings.items.find((b) => b.code === failingBuildingCode);
  if (rolledBackBuilding) {
    throw new Error(
      'ROLLBACK FAILED! Building created before simulated failure still exists in PostgreSQL!'
    );
  }
  console.log(
    '✅ Transactional Rollback Verified: 0 partial rows written to PostgreSQL on failure'
  );

  // 8. Scenario 7 — Existing Granular CRUD Compatibility
  const updatedRoom = await roomRepo.updateForOrganization(r101.id, orgA.id, {
    roomNumber: `101-RENAMED-${suffix}`,
  });
  if (!updatedRoom || updatedRoom.room_number !== `101-RENAMED-${suffix}`) {
    throw new Error('Failed to update individual room number post-bulk setup');
  }

  const newBed = await bedRepo.createForOrganization(orgA.id, {
    roomId: r101.id,
    bedNumber: 'Bed 3 Extra',
    displayOrder: 3,
  });
  if (!newBed || newBed.bed_number !== 'Bed 3 Extra') {
    throw new Error('Failed to add individual bed post-bulk setup');
  }

  const updatedBedsCount = await roomRepo.countBedsInRoom(r101.id, orgA.id);
  if (updatedBedsCount !== 3) {
    throw new Error(
      `Expected 3 beds in Room 101 after adding extra bed, found ${updatedBedsCount}`
    );
  }
  console.log('✅ Existing Granular CRUD Compatibility Verified');

  console.log('\n================================================');
  console.log('BUILDING SETUP WIZARD E2E VERIFICATION RESULT');
  console.log('================================================');
  console.log({
    scaffold: { orgAId: orgA.id, orgBId: orgB.id, propertyAId: propA.id },
    bulkSetup: {
      buildingId: setupResult.building.id,
      floorsCount: setupResult.floorsCount,
      roomsCount: setupResult.roomsCount,
      bedsCount: setupResult.bedsCount,
      assignedFacilitiesCount: setupResult.assignedFacilitiesCount,
    },
    directPostgresVerification: true,
    duplicateBuildingProtection: duplicateBuildingRejected,
    duplicateRoomProtection: duplicateRoomRejected,
    crossTenantPropertyProtection: crossTenantPropertyRejected,
    crossTenantFacilityProtection: crossTenantFacilityRejected,
    transactionalRollback: rollbackExceptionCaught && !rolledBackBuilding,
    granularCrudCompatibility: true,
  });

  console.log('\n🎉 BUILDING SETUP WIZARD E2E VERIFICATION PASSED 100%!');
}

runBuildingSetupE2EVerification()
  .then(async () => {
    await dbService.shutdown();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ E2E VERIFICATION FAILED:', err);
    await dbService.shutdown();
    process.exit(1);
  });
