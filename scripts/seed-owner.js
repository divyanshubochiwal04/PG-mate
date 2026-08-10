const pg = require('../packages/database/node_modules/pg');
const argon2 = require('../packages/security/node_modules/argon2');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envContent = fs.readFileSync(path.join(rootDir, '.env'), 'utf8');
const envLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
const DATABASE_URL = envLine ? envLine.split('=').slice(1).join('=').trim().replace(/^"(.*)"$/, '$1') : 'postgres://postgres:postgres@localhost:5432/m_square';

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function seed() {
  console.log('Connecting to PostgreSQL database at:', DATABASE_URL);

  // 1. Ensure tables exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      email_verified_at TIMESTAMPTZ,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS organization_memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(organization_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      revocation_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
  `);
  console.log('Database tables verified.');

  const email = 'owner@example.com';
  const password = 'Password123!';

  // Check if owner@example.com exists
  const existingRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingRes.rows.length > 0) {
    console.log(`User ${email} already exists in database.`);
    await pool.end();
    return;
  }

  // Hash password using Argon2id
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Insert user
  const userRes = await pool.query(
    'INSERT INTO users (email, password_hash, status) VALUES ($1, $2, $3) RETURNING id',
    [email, passwordHash, 'ACTIVE']
  );
  const userId = userRes.rows[0].id;

  // Insert organization
  const orgRes = await pool.query(
    'INSERT INTO organizations (name, slug, status) VALUES ($1, $2, $3) RETURNING id',
    ['PG Owner Organization', 'org-owner-example', 'ACTIVE']
  );
  const orgId = orgRes.rows[0].id;

  // Insert membership
  await pool.query(
    'INSERT INTO organization_memberships (organization_id, user_id) VALUES ($1, $2)',
    [orgId, userId]
  );

  console.log(`Successfully created user ${email} (ID: ${userId}) with Organization ID ${orgId}`);
  await pool.end();
}

seed().catch(err => {
  console.error('Seed script failed:', err);
  pool.end();
  process.exit(1);
});
