import type { AuthDatabaseSchema } from './auth.schema';
import type { TenantDatabaseSchema } from './tenant.schema';

export type DatabaseSchema = AuthDatabaseSchema & TenantDatabaseSchema;
