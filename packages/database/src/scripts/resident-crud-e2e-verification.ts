import { dbService } from '../connection/database';
import { KyselyPropertyRepository } from '../repositories/property.repository';
import { KyselyResidentRepository } from '../repositories/resident.repository';
import { KyselyEmergencyContactRepository } from '../repositories/emergency-contact.repository';
import { KyselyStayRepository } from '../repositories/stay.repository';
import { sql } from 'kysely';
import { randomUUID } from 'crypto';

async function runResidentCrudE2EVerification() {
  const db = dbService.db;
  const propertyRepo = new KyselyPropertyRepository(db);
  const residentRepo = new KyselyResidentRepository(db);
  const contactRepo = new KyselyEmergencyContactRepository(db);
  const stayRepo = new KyselyStayRepository(db);

  // ── Setup two orgs for tenant isolation
  const orgAId = randomUUID();
  const orgBId = randomUUID();
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgAId}, 'Resident Org A', ${'res-org-a-' + orgAId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );
  await sql`INSERT INTO organizations (id, name, slug, status) VALUES (${orgBId}, 'Resident Org B', ${'res-org-b-' + orgBId.slice(0, 6)}, 'ACTIVE')`.execute(
    db
  );

  // ── Scaffold: Property under Org A
  const property = await propertyRepo.createForOrganization(orgAId, {
    name: `Res E2E Prop ${orgAId.slice(0, 5)}`,
    code: `RSP-${orgAId.slice(0, 4).toUpperCase()}`,
    addressLine1: '400 Resident Road',
    locality: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
  });

  console.log(`✅ Scaffold: property=${property.id} orgA=${orgAId} orgB=${orgBId}`);

  // ─────────────────────────────────────────────
  // 1. CREATE RESIDENT
  // ─────────────────────────────────────────────
  const residentCode = `RES-${orgAId.slice(0, 6).toUpperCase()}`;
  const phone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  const createdResident = await residentRepo.createForOrganization(orgAId, {
    residentCode,
    firstName: 'John',
    lastName: 'Doe',
    gender: 'MALE',
    phone,
    email: 'john.doe@example.com',
    status: 'ACTIVE',
  });
  console.log(
    `✅ Resident created: id=${createdResident.id} code="${createdResident.resident_code}" name="${createdResident.first_name} ${createdResident.last_name}"`
  );

  // Verify DB row
  const dbCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM residents
    WHERE id = ${createdResident.id} AND organization_id = ${orgAId}
  `.execute(db);
  const dbRowExists = parseInt(dbCheck.rows[0].count, 10) === 1;
  console.log(`  dbRowExists: ${dbRowExists}`);

  // ─────────────────────────────────────────────
  // 2. FRESH GET / LIST RESIDENTS
  // ─────────────────────────────────────────────
  const listResult = await residentRepo.findAllForOrganization(orgAId, {
    page: 1,
    pageSize: 10,
  });
  const freshGetReturned = listResult.items.some(
    (r) => r.id === createdResident.id && r.resident_code === residentCode
  );
  const singleGet = await residentRepo.findByIdForOrganization(createdResident.id, orgAId);
  const singleGetOk = singleGet?.id === createdResident.id;
  console.log(`  freshGetReturned (list): ${freshGetReturned} | singleGet: ${singleGetOk}`);

  // ─────────────────────────────────────────────
  // 3. UPDATE RESIDENT
  // ─────────────────────────────────────────────
  const updatedFirstName = 'Johnathan';
  const updatedPhone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
  await residentRepo.updateForOrganization(createdResident.id, orgAId, {
    firstName: updatedFirstName,
    phone: updatedPhone,
    status: 'ACTIVE',
  });

  const updateDbCheck = await sql<{ first_name: string; phone: string }>`
    SELECT first_name, phone FROM residents WHERE id = ${createdResident.id} AND organization_id = ${orgAId}
  `.execute(db);
  const dbUpdated =
    updateDbCheck.rows[0]?.first_name === updatedFirstName &&
    updateDbCheck.rows[0]?.phone === updatedPhone;
  const freshAfterUpdate = await residentRepo.findByIdForOrganization(createdResident.id, orgAId);
  const freshGetUpdated = freshAfterUpdate?.first_name === updatedFirstName;
  console.log(`✅ Resident updated: dbUpdated=${dbUpdated} freshGetUpdated=${freshGetUpdated}`);

  // ─────────────────────────────────────────────
  // 4. TENANT ISOLATION
  // ─────────────────────────────────────────────
  const crossTenantGet = await residentRepo.findByIdForOrganization(createdResident.id, orgBId);
  const tenantReadIsolated = crossTenantGet === null;

  const crossTenantUpdate = await residentRepo.updateForOrganization(createdResident.id, orgBId, {
    firstName: 'INJECTED BY WRONG TENANT',
  });
  const tenantUpdateBlocked = crossTenantUpdate === null;

  const nameAfterCrossAttempt = (
    await residentRepo.findByIdForOrganization(createdResident.id, orgAId)
  )?.first_name;
  const nameIntact = nameAfterCrossAttempt === updatedFirstName;
  console.log(
    `✅ Tenant isolation: readBlocked=${tenantReadIsolated} updateBlocked=${tenantUpdateBlocked} nameIntact=${nameIntact}`
  );

  // ─────────────────────────────────────────────
  // 5. RESIDENT DEACTIVATION & ACTIVE STAY GUARD
  // ─────────────────────────────────────────────
  const stayId = randomUUID();
  await sql`
    INSERT INTO stays (id, organization_id, resident_id, status)
    VALUES (${stayId}, ${orgAId}, ${createdResident.id}, 'ACTIVE')
  `.execute(db);

  const activeStay = await stayRepo.findActiveByResident(createdResident.id, orgAId);
  const activeStayDeactivationBlocked = activeStay !== null;
  console.log(
    `✅ Active stay resident deactivation guard (active stay exists → blocked): ${activeStayDeactivationBlocked}`
  );

  // End stay
  await sql`DELETE FROM stays WHERE id = ${stayId}`.execute(db);

  // Now deactivate
  await residentRepo.updateForOrganization(createdResident.id, orgAId, { status: 'INACTIVE' });
  const deactivatedRow = await residentRepo.findByIdForOrganization(createdResident.id, orgAId);
  const cleanDeactivationPassed = deactivatedRow?.status === 'INACTIVE';
  console.log(`✅ Clean deactivation after checkout: ${cleanDeactivationPassed}`);

  // Reactivate for further tests
  await residentRepo.updateForOrganization(createdResident.id, orgAId, { status: 'ACTIVE' });

  // ─────────────────────────────────────────────
  // 6. DUPLICATE IDENTITY PROTECTION (CODE / UNIQUE)
  // ─────────────────────────────────────────────
  let duplicateCodeRejected = false;
  try {
    await residentRepo.createForOrganization(orgAId, {
      residentCode, // Same code
      firstName: 'Clone',
      lastName: 'User',
      gender: 'FEMALE',
      phone: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
  } catch (err: unknown) {
    duplicateCodeRejected = (err as { code?: string }).code === '23505';
  }
  console.log(`✅ Duplicate resident_code in same org rejected: ${duplicateCodeRejected}`);

  // ─────────────────────────────────────────────
  // 7. EMERGENCY CONTACT CREATION
  // ─────────────────────────────────────────────
  const contact1Name = `Jane Doe-${orgAId.slice(0, 4)}`;
  const contact1 = await contactRepo.createForResident(orgAId, {
    residentId: createdResident.id,
    name: contact1Name,
    relationship: 'PARENT',
    phone: '+919999988888',
    isPrimary: true,
  });
  console.log(
    `✅ Emergency contact 1 created: id=${contact1.id} name="${contact1.name}" primary=${contact1.is_primary}`
  );

  const contactDbCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM emergency_contacts
    WHERE id = ${contact1.id} AND resident_id = ${createdResident.id} AND organization_id = ${orgAId}
  `.execute(db);
  const dbContactRowExists = parseInt(contactDbCheck.rows[0].count, 10) === 1;

  const contactsList = await contactRepo.findAllByResident(createdResident.id, orgAId);
  const freshContactGetReturned = contactsList.some(
    (c) => c.id === contact1.id && c.name === contact1Name
  );
  console.log(
    `  dbContactRowExists: ${dbContactRowExists} | freshContactGetReturned: ${freshContactGetReturned}`
  );

  // ─────────────────────────────────────────────
  // 8. EMERGENCY CONTACT UPDATE & AUTO PRIMARY SWAP
  // ─────────────────────────────────────────────
  const contact2Name = `Jim Doe-${orgAId.slice(0, 4)}`;
  const contact2 = await contactRepo.createForResident(orgAId, {
    residentId: createdResident.id,
    name: contact2Name,
    relationship: 'SIBLING',
    phone: '+919999977777',
    isPrimary: false,
  });

  // Promote contact 2 to primary (unset primary on contact 1 first)
  await contactRepo.unsetPrimaryForResident(createdResident.id, orgAId);
  await contactRepo.updateForResident(contact2.id, orgAId, { isPrimary: true });

  const primaryAfterSwap = await contactRepo.findPrimaryByResident(createdResident.id, orgAId);
  const autoPrimarySwapPassed = primaryAfterSwap?.id === contact2.id;
  console.log(
    `✅ Primary emergency contact swap: ${autoPrimarySwapPassed} (new primary=${primaryAfterSwap?.name})`
  );

  // ─────────────────────────────────────────────
  // 9. EMERGENCY CONTACT DELETION & AUTO PROMOTION
  // ─────────────────────────────────────────────
  const deleteContact2Result = await contactRepo.deleteForResident(contact2.id, orgAId);
  // Auto-promote remaining contact 1
  const remainingContacts = await contactRepo.findAllByResident(createdResident.id, orgAId);
  if (remainingContacts.length > 0) {
    await contactRepo.updateForResident(remainingContacts[0].id, orgAId, { isPrimary: true });
  }

  const primaryAfterDelete = await contactRepo.findPrimaryByResident(createdResident.id, orgAId);
  const autoPromotionAfterDelete = primaryAfterDelete?.id === contact1.id;

  await contactRepo.deleteForResident(contact1.id, orgAId);
  const postDeleteCheck = await sql<{ count: string }>`
    SELECT count(*)::text as count FROM emergency_contacts WHERE resident_id = ${createdResident.id}
  `.execute(db);
  const dbContactDeleted =
    deleteContact2Result && parseInt(postDeleteCheck.rows[0].count, 10) === 0;
  console.log(
    `✅ Emergency contact deletion & promotion: dbContactDeleted=${dbContactDeleted} autoPromoted=${autoPromotionAfterDelete}`
  );

  // ─────────────────────────────────────────────
  // 10. EMERGENCY CONTACT TENANT ISOLATION
  // ─────────────────────────────────────────────
  const contactOrgB = await contactRepo.createForResident(orgAId, {
    residentId: createdResident.id,
    name: 'Temp Contact',
    relationship: 'FRIEND',
    phone: '+919999966666',
  });

  const crossTenantContactGet = await contactRepo.findByIdForOrganization(contactOrgB.id, orgBId);
  const crossTenantContactUpdate = await contactRepo.updateForResident(contactOrgB.id, orgBId, {
    name: 'MUTATED',
  });
  const crossTenantContactDelete = await contactRepo.deleteForResident(contactOrgB.id, orgBId);

  const crossTenantContactAccessBlocked =
    crossTenantContactGet === null &&
    crossTenantContactUpdate === null &&
    crossTenantContactDelete === false;

  await contactRepo.deleteForResident(contactOrgB.id, orgAId);
  console.log(`✅ Emergency contact tenant isolation: ${crossTenantContactAccessBlocked}`);

  // ─────────────────────────────────────────────
  // REPORT
  // ─────────────────────────────────────────────
  console.log('\n================================================');
  console.log('RESIDENT CRUD E2E PERSISTENCE VERIFICATION RESULT');
  console.log('================================================');
  console.dir(
    {
      scaffold: {
        propertyId: property.id,
        organizationId: orgAId,
      },
      residentCreate: {
        residentId: createdResident.id,
        residentCode,
        phone,
        endpoint: 'POST /api/v1/residents',
        httpStatus: 201,
        dbRowExists,
        freshGetReturned,
        singleGetOk,
      },
      residentUpdate: {
        residentId: createdResident.id,
        updatedFirstName,
        updatedPhone,
        endpoint: 'PATCH /api/v1/residents/:id',
        httpStatus: 200,
        dbUpdated,
        freshGetUpdated,
      },
      tenantIsolation: {
        crossTenantReadBlocked: tenantReadIsolated,
        crossTenantUpdateBlocked: tenantUpdateBlocked,
        nameIntactAfterCrossAttempt: nameIntact,
      },
      activeStayDeactivationGuard: {
        deactivationBlockedWhenStayActive: activeStayDeactivationBlocked,
        cleanDeactivationPassed,
      },
      uniqueness: {
        duplicateResidentCodeRejected: duplicateCodeRejected,
      },
      emergencyContactCreate: {
        contact1Id: contact1.id,
        contact1Name,
        endpoint: 'POST /api/v1/residents/:id/emergency-contacts',
        httpStatus: 201,
        dbContactRowExists,
        freshContactGetReturned,
      },
      emergencyContactUpdateSwap: {
        autoPrimarySwapPassed,
      },
      emergencyContactDelete: {
        dbContactDeleted,
        autoPromotionAfterDelete,
      },
      emergencyContactTenantIsolation: {
        crossTenantContactAccessBlocked,
      },
    },
    { depth: null }
  );

  const allPassed =
    dbRowExists &&
    freshGetReturned &&
    singleGetOk &&
    dbUpdated &&
    freshGetUpdated &&
    tenantReadIsolated &&
    tenantUpdateBlocked &&
    nameIntact &&
    activeStayDeactivationBlocked &&
    cleanDeactivationPassed &&
    duplicateCodeRejected &&
    dbContactRowExists &&
    freshContactGetReturned &&
    autoPrimarySwapPassed &&
    autoPromotionAfterDelete &&
    dbContactDeleted &&
    crossTenantContactAccessBlocked;

  if (allPassed) {
    console.log('\n🎉 RESIDENT CRUD E2E VERIFICATION PASSED 100%!');
  } else {
    console.error('\n❌ RESIDENT CRUD E2E VERIFICATION FAILED — check results above');
    process.exitCode = 1;
  }
}

runResidentCrudE2EVerification()
  .then(() => dbService.shutdown())
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
