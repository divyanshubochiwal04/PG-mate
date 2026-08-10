import type { Generated } from 'kysely';

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  status: string;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface UserSessionsTable {
  id: Generated<string>;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Generated<Date>;
  last_used_at: Generated<Date>;
  expires_at: Date;
  revoked_at: Date | null;
  revocation_reason: string | null;
}

export interface RefreshTokensTable {
  id: Generated<string>;
  session_id: string;
  token_hash: string;
  status: string;
  created_at: Generated<Date>;
  expires_at: Date;
  used_at: Date | null;
}

export interface PasswordResetTokensTable {
  id: Generated<string>;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Generated<Date>;
}

export interface AuthDatabaseSchema {
  users: UsersTable;
  user_sessions: UserSessionsTable;
  refresh_tokens: RefreshTokensTable;
  password_reset_tokens: PasswordResetTokensTable;
}
