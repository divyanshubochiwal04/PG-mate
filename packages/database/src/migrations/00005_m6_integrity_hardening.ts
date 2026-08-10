import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE UNIQUE INDEX idx_unique_active_allocation_per_stay
    ON bed_allocations (stay_id)
    WHERE status = 'ACTIVE'
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_unique_active_allocation_per_stay').ifExists().execute();
}
