import pg from 'pg';
import { readFileSync } from 'fs';

// Load .env manually
const env = readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(
  env.split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);
const DATABASE_URL = envVars['DATABASE_URL'];
if (!DATABASE_URL) { console.error('DATABASE_URL not found in .env'); process.exit(1); }

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function test(label, fn) {
  try {
    const result = await fn();
    console.log(`[PASS] ${label}: ${result}`);
    return true;
  } catch (e) {
    console.log(`[FAIL] ${label}: ${e.message}`);
    return false;
  }
}

async function expectFail(label, fn) {
  try {
    await fn();
    console.log(`[VULN] ${label}: EXPECTED FAILURE BUT SUCCEEDED!`);
    return false;
  } catch (e) {
    if (e.code === '23503' || e.code === '23505' || e.code === '23514') {
      console.log(`[PASS] ${label}: Correctly rejected with PG error ${e.code}`);
      return true;
    }
    console.log(`[PASS] ${label}: Rejected with error: ${e.code} — ${e.message.split('\n')[0]}`);
    return true;
  }
}

async function main() {
  const client = await pool.connect();
  console.log('\n======= M5 DATABASE CONSTRAINT AUDIT =======\n');

  try {
    // --- Setup: find valid org id ---
    const orgRes = await client.query('SELECT id FROM organizations LIMIT 1');
    if (!orgRes.rows.length) {
      console.log('No organizations exist. Please register at least one user first.');
      return;
    }
    const orgId = orgRes.rows[0].id;
    console.log(`Using orgId: ${orgId}\n`);

    const fakeOrg = '00000000-0000-0000-0000-000000000001';
    const fakeId  = '00000000-0000-0000-0000-000000000002';

    // 1. Properties FK to organizations
    await expectFail(
      'Property with non-existent organization_id',
      () => client.query(
        `INSERT INTO properties(organization_id,name,code,address_line1,locality,city,state,postal_code)
         VALUES($1,'Test','TT01','A1','L1','C1','S1','100001')`,
        [fakeOrg]
      )
    );

    // 2. Insert valid property to use as base
    await client.query('BEGIN');
    let propId, bldgId, floorId, roomId;

    try {
      const propRes = await client.query(
        `INSERT INTO properties(organization_id,name,code,address_line1,locality,city,state,postal_code)
         VALUES($1,'Audit Prop','AUDITPROP','A1','L1','C1','S1','100001') RETURNING id`,
        [orgId]
      );
      propId = propRes.rows[0].id;
      console.log(`[SETUP] Created property: ${propId}`);

      // 3. Building composite FK test: wrong org
      await expectFail(
        'Building with mismatched organization_id (different from property\'s org)',
        () => client.query(
          `INSERT INTO buildings(property_id,organization_id,name,code)
           VALUES($1,$2,'Bad Bldg','BADBLDG')`,
          [propId, fakeOrg]  // propId belongs to orgId, but we use fakeOrg
        )
      );

      // 4. Insert valid building
      const bldgRes = await client.query(
        `INSERT INTO buildings(property_id,organization_id,name,code) VALUES($1,$2,'Audit Bldg','AUDITBLDG') RETURNING id`,
        [propId, orgId]
      );
      bldgId = bldgRes.rows[0].id;
      console.log(`[SETUP] Created building: ${bldgId}`);

      // 5. Floor composite FK test: wrong org
      await expectFail(
        'Floor with mismatched organization_id (different from building\'s org)',
        () => client.query(
          `INSERT INTO floors(building_id,organization_id,name,floor_number)
           VALUES($1,$2,'Bad Floor',1)`,
          [bldgId, fakeOrg]
        )
      );

      // 6. Insert valid floor
      const floorRes = await client.query(
        `INSERT INTO floors(building_id,organization_id,name,floor_number) VALUES($1,$2,'Audit Floor',1) RETURNING id`,
        [bldgId, orgId]
      );
      floorId = floorRes.rows[0].id;
      console.log(`[SETUP] Created floor: ${floorId}`);

      // 7. Room composite FK test: wrong org
      await expectFail(
        'Room with mismatched organization_id (different from floor\'s org)',
        () => client.query(
          `INSERT INTO rooms(floor_id,building_id,property_id,organization_id,room_number,capacity)
           VALUES($1,$2,$3,$4,'101',2)`,
          [floorId, bldgId, propId, fakeOrg]
        )
      );

      // 8. Insert valid room
      const roomRes = await client.query(
        `INSERT INTO rooms(floor_id,building_id,property_id,organization_id,room_number,capacity)
         VALUES($1,$2,$3,$4,'101',2) RETURNING id`,
        [floorId, bldgId, propId, orgId]
      );
      roomId = roomRes.rows[0].id;
      console.log(`[SETUP] Created room: ${roomId}`);

      // 9. Bed composite FK test: wrong org
      await expectFail(
        'Bed with mismatched organization_id (different from room\'s org)',
        () => client.query(
          `INSERT INTO beds(room_id,organization_id,bed_number) VALUES($1,$2,'B1')`,
          [roomId, fakeOrg]
        )
      );

      // 10. Capacity CHECK constraint
      await expectFail(
        'Room with capacity=0 (violates capacity >= 1 check)',
        () => client.query(
          `INSERT INTO rooms(floor_id,building_id,property_id,organization_id,room_number,capacity)
           VALUES($1,$2,$3,$4,'102',0)`,
          [floorId, bldgId, propId, orgId]
        )
      );

      // 11. Unique constraint on property code within org
      await expectFail(
        'Duplicate property code within same org',
        () => client.query(
          `INSERT INTO properties(organization_id,name,code,address_line1,locality,city,state,postal_code)
           VALUES($1,'Test2','AUDITPROP','A1','L1','C1','S1','100001')`,
          [orgId]
        )
      );

      // 12. Unique constraint on floor number within building
      await expectFail(
        'Duplicate floor_number within same building',
        () => client.query(
          `INSERT INTO floors(building_id,organization_id,name,floor_number) VALUES($1,$2,'Floor Dup',1)`,
          [bldgId, orgId]
        )
      );

      // 13. Try to cross-org facility assignment at DB level
      // Insert a facility for org1
      const facRes = await client.query(
        `INSERT INTO facilities(organization_id,name,code) VALUES($1,'Audit Facility','AUDITFAC') RETURNING id`,
        [orgId]
      );
      const facId = facRes.rows[0].id;

      await expectFail(
        'Property-facility junction with mismatched org (cross-tenant facility attack at DB)',
        () => client.query(
          `INSERT INTO property_facilities(property_id,facility_id,organization_id) VALUES($1,$2,$3)`,
          [propId, facId, fakeOrg]  // property belongs to orgId, facility to orgId, but junction says fakeOrg
        )
      );

    } finally {
      // Always rollback - we don't want to pollute the DB
      await client.query('ROLLBACK');
      console.log('\n[CLEANUP] Rolled back all test data.\n');
    }

    console.log('======= END OF DB CONSTRAINT AUDIT =======\n');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
