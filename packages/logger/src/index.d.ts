import * as winston from 'winston';
/**
 * createAppLogger — factory allowing configuration injection.
 * Exported for testing purposes so tests can pass explicit options
 * without relying on process.env at module-load time.
 */
export declare function createAppLogger(options?: {
    nodeEnv?: string;
    logLevel?: string;
}): winston.Logger;
export declare const logger: winston.Logger;
export { redactSensitiveData } from './redact';
export default logger;
//# sourceMappingURL=index.d.ts.map