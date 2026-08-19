import { Pool, type PoolConfig } from 'pg';
export declare function createPgPool(overrideConfig?: PoolConfig): Pool;
export declare function closePgPool(): Promise<void>;
//# sourceMappingURL=pool.d.ts.map