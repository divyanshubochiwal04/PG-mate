import * as winston from 'winston';
import { redactSensitiveData } from './redact';

// Winston format plugin that applies redaction before serialization
const redactFormat = winston.format((info: winston.Logform.TransformableInfo) => {
  return redactSensitiveData(info as Record<string, unknown>) as winston.Logform.TransformableInfo;
});

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, ...meta } = info as { timestamp?: string; level?: string; message?: string } & Record<string, unknown>;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

const productionFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

/**
 * createAppLogger — factory allowing configuration injection.
 * Exported for testing purposes so tests can pass explicit options
 * without relying on process.env at module-load time.
 */
export function createAppLogger(options?: { nodeEnv?: string; logLevel?: string }): winston.Logger {
  const nodeEnv = options?.nodeEnv ?? process.env['NODE_ENV'] ?? 'development';
  const logLevel = options?.logLevel ?? process.env['LOG_LEVEL'] ?? 'info';
  const isDevelopment = nodeEnv !== 'production';

  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      redactFormat(),
      isDevelopment ? developmentFormat : productionFormat
    ),
    transports: [new winston.transports.Console()],
  });
}

// Default singleton logger for runtime use
export const logger = createAppLogger();
export { redactSensitiveData } from './redact';
export default logger;
