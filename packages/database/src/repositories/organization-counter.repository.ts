import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../connection/database';

export class KyselyOrganizationCounterRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private getExecutor(trx?: Transaction<DatabaseSchema>) {
    return trx && typeof (trx as unknown as Record<string, unknown>).selectFrom === 'function'
      ? trx
      : this.db;
  }

  public async getNextValueForUpdate(
    organizationId: string,
    counterType: string,
    trx?: Transaction<DatabaseSchema>
  ): Promise<number> {
    const executor = this.getExecutor(trx);

    // Lock counter row or insert if not exists
    const counter = await executor
      .selectFrom('organization_counters')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .where('counter_type', '=', counterType)
      .forUpdate()
      .executeTakeFirst();

    if (counter) {
      const nextVal = counter.current_value + 1;
      await executor
        .updateTable('organization_counters')
        .set({ current_value: nextVal, updated_at: new Date() })
        .where('id', '=', counter.id)
        .execute();
      return nextVal;
    }

    // Insert new counter starting at 1
    const newCounter = await executor
      .insertInto('organization_counters')
      .values({
        organization_id: organizationId,
        counter_type: counterType,
        current_value: 1,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return newCounter.current_value;
  }
}
