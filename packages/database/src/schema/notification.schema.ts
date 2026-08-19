import type { ColumnType, Generated, Selectable } from 'kysely';

export type NotificationStatus = 'UNREAD' | 'READ' | 'RESOLVED' | 'DISMISSED';
export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface NotificationsTable {
  id: Generated<string>;
  organization_id: string;
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_route: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: ColumnType<Record<string, any> | null, string | Record<string, any> | null, string | Record<string, any> | null>;
  dedupe_key: string | null;
  status: NotificationStatus;
  created_at: ColumnType<Date, string | Date | undefined, never>;
  read_at: ColumnType<Date | null, string | Date | null | undefined, string | Date | null | undefined>;
  resolved_at: ColumnType<Date | null, string | Date | null | undefined, string | Date | null | undefined>;
  expires_at: ColumnType<Date | null, string | Date | null | undefined, string | Date | null | undefined>;
}

export type NotificationRow = Selectable<NotificationsTable>;
