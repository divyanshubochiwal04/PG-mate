import type { ColumnType, Generated, Selectable } from 'kysely';

export interface UserPushTokensTable {
  id: Generated<string>;
  user_id: string;
  organization_id: string;
  push_token: string;
  device_type: string;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  updated_at: ColumnType<Date, string | Date | undefined, string | Date | undefined>;
}

export type UserPushTokenRow = Selectable<UserPushTokensTable>;
