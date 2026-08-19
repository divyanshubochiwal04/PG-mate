import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE resident_mess_subscriptions 
    DROP CONSTRAINT IF EXISTS check_subs_status
  `.execute(db);

  await sql`
    ALTER TABLE resident_mess_subscriptions 
    ADD CONSTRAINT check_subs_status 
    CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED', 'SUPERSEDED'))
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE resident_mess_subscriptions 
    DROP CONSTRAINT IF EXISTS check_subs_status
  `.execute(db);

  await sql`
    ALTER TABLE resident_mess_subscriptions 
    ADD CONSTRAINT check_subs_status 
    CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED'))
  `.execute(db);
}
