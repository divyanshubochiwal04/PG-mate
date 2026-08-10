const pg = require('../packages/database/node_modules/pg');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envContent = fs.readFileSync(path.join(rootDir, '.env'), 'utf8');
const envLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
const DATABASE_URL = envLine.split('=').slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function expectFail(label, queryFn) {
  try {
    await queryFn();
    console.log('[VULN] ' + label + ': EXPECTED DB REJECTION BUT SUCCEEDED — DATA INTEGRITY HOLE!');
    return false;
  } catch (e) {
    console.log('[PASS] ' + label + ' -> rejected with PG ' + e.code);
    return true;
  }
}

async function expectPass(label, queryFn) {
  try {
    const r = await queryFn();
    console.log('[PASS] ' + label);
    return r;
  } catch (e) {
    console.log('[FAIL] ' + label + ': unexpected rejection -> ' + e.message.split('\n')[0]);
    throw e;
  }
}

async function main() {
  const client = await pool.connect();
  console.log('\n=== M5 DATABASE CONSTRAINT AUDIT ===\n');

  try {
    const orgRes = await client.query('SELECT id FROM organizations LIMIT 1');
    if (!orgRes.rows.length) {
      console.log('No organizations found. Run app and register a user first.');
      return;
    }
    const orgId = orgRes.rows[0].id;
    const fakeOrg = '00000000-0000-0000-0000-000000000001';
    console.log('Using orgId: ' + orgId + '\n');

    await client.query('BEGIN');
    let propId, bldgId, floorId, roomId, facId;

    try {
      // ── 1. Properties FK to organizations
      await expectFail('Property with non-existent org_id (FK to organizations)', async () => {
        await client.query(
          'INSERT INTO properties(organization_id,name,code,address_line1,locality,city,state,postal_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
          [fakeOrg, 'Test', 'FKTEST', 'A1', 'L1', 'C1', 'S1', '100001']
        );
      });

      // ── Setup: valid property
      const p = await expectPass('Create valid property', async () => {
        const r = await client.query(
          'INSERT INTO properties(organization_id,name,code,address_line1,locality,city,state,postal_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
          [orgId, 'AuditProp', 'AUDPROP1', 'A1', 'L1', 'C1', 'S1', '100001']
        );
        return r;
      });
      propId = p.rows[0].id;

      // ── 2. Buildings composite FK (property_id + organization_id)
      await expectFail('Building: propId belongs to orgId, but building uses fakeOrg', async () => {
        await client.query(
          'INSERT INTO buildings(property_id,organization_id,name,code) VALUES($1,$2,$3,$4)',
          [propId, fakeOrg, 'BadBldg', 'BADBLDG']
        );
      });

      const bldg = await expectPass('Create valid building', async () => {
        return await client.query(
          'INSERT INTO buildings(property_id,organization_id,name,code) VALUES($1,$2,$3,$4) RETURNING id',
          [propId, orgId, 'AuditBldg', 'AUDBLDG']
        );
      });
      bldgId = bldg.rows[0].id;

      // ── 3. Floors composite FK
      await expectFail('Floor: bldgId belongs to orgId, but floor uses fakeOrg', async () => {
        await client.query(
          'INSERT INTO floors(building_id,organization_id,name,floor_number) VALUES($1,$2,$3,$4)',
          [bldgId, fakeOrg, 'BadFloor', 1]
        );
      });

      const floor = await expectPass('Create valid floor', async () => {
        return await client.query(
          'INSERT INTO floors(building_id,organization_id,name,floor_number) VALUES($1,$2,$3,$4) RETURNING id',
          [bldgId, orgId, 'AuditFloor', 1]
        );
      });
      floorId = floor.rows[0].id;

      // ── 4. Rooms composite FK
      await expectFail('Room: floor belongs to orgId, but room uses fakeOrg', async () => {
        await client.query(
          'INSERT INTO rooms(floor_id,building_id,property_id,organization_id,room_number,capacity) VALUES($1,$2,$3,$4,$5,$6)',
          [floorId, bldgId, propId, fakeOrg, '101', 2]
        );
      });

      const room = await expectPass('Create valid room', async () => {
        return await client.query(
          'INSERT INTO rooms(floor_id,building_id,property_id,organization_id,room_number,capacity) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',
          [floorId, bldgId, propId, orgId, '101', 2]
        );
      });
      roomId = room.rows[0].id;

      // ── 5. Beds composite FK
      await expectFail('Bed: roomId belongs to orgId, but bed uses fakeOrg', async () => {
        await client.query(
          'INSERT INTO beds(room_id,organization_id,bed_number) VALUES($1,$2,$3)',
          [roomId, fakeOrg, 'B1']
        );
      });

      // ── 6. Capacity CHECK constraint
      await expectFail('Room capacity=0 violates CHECK(capacity>=1)', async () => {
        await client.query(
          'INSERT INTO rooms(floor_id,building_id,property_id,organization_id,room_number,capacity) VALUES($1,$2,$3,$4,$5,$6)',
          [floorId, bldgId, propId, orgId, '102', 0]
        );
      });

      // ── 7. Unique property code within org
      await expectFail('Duplicate property code within same org', async () => {
        await client.query(
          'INSERT INTO properties(organization_id,name,code,address_line1,locality,city,state,postal_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
          [orgId, 'AuditProp2', 'AUDPROP1', 'A1', 'L1', 'C1', 'S1', '100001']
        );
      });

      // ── 8. Unique floor number within building
      await expectFail('Duplicate floor_number in same building', async () => {
        await client.query(
          'INSERT INTO floors(building_id,organization_id,name,floor_number) VALUES($1,$2,$3,$4)',
          [bldgId, orgId, 'FloorDup', 1]
        );
      });

      // ── 9. Facility cross-tenant at DB level
      const fac = await expectPass('Create valid facility', async () => {
        return await client.query(
          'INSERT INTO facilities(organization_id,name,code) VALUES($1,$2,$3) RETURNING id',
          [orgId, 'AuditFac', 'AUDFAC']
        );
      });
      facId = fac.rows[0].id;

      await expectFail('property_facilities junction with fakeOrg: composite FK on property AND facility', async () => {
        await client.query(
          'INSERT INTO property_facilities(property_id,facility_id,organization_id) VALUES($1,$2,$3)',
          [propId, facId, fakeOrg]
        );
      });

      await expectFail('room_facilities junction with fakeOrg: FK on room AND facility fails', async () => {
        await client.query(
          'INSERT INTO room_facilities(room_id,facility_id,organization_id) VALUES($1,$2,$3)',
          [roomId, facId, fakeOrg]
        );
      });

      // ── 10. Can we move a building to a different property (same org) by UPDATE?
      const p2 = await client.query(
        'INSERT INTO properties(organization_id,name,code,address_line1,locality,city,state,postal_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
        [orgId, 'AuditProp2', 'AUDPROP2', 'A1', 'L1', 'C1', 'S1', '100001']
      );
      const propId2 = p2.rows[0].id;

      // This should succeed because propId2 also has orgId — this is an expected design trade-off
      try {
        await client.query(
          'UPDATE buildings SET property_id=$1 WHERE id=$2',
          [propId2, bldgId]
        );
        console.log('[NOTE] UPDATE building.property_id to different property (same org) is allowed — design consideration');
      } catch(e) {
        console.log('[NOTE] UPDATE building.property_id: ' + e.message.split('\n')[0]);
      }

    } finally {
      await client.query('ROLLBACK');
      console.log('\n[CLEANUP] Rolled back all audit test data.');
    }

    console.log('\n=== END DB CONSTRAINT AUDIT ===\n');

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('FATAL AUDIT ERROR:', e.message); process.exit(1); });
