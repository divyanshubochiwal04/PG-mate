import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { dbService, MigrationService } from '@m-square/database';
import { AppModule } from './app.module';
import { config } from '@m-square/config';
import { logger } from '@m-square/logger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { setupSwagger } from './common/swagger/swagger.config';

async function bootstrap(): Promise<void> {
  // Verify database schema readiness and execute migrations
  try {
    const migrationService = new MigrationService(dbService.db);
    await migrationService.migrateToLatest();
    const readiness = await migrationService.verifySchemaReadiness();
    if (!readiness.isReady) {
      logger.error('🚨 CRITICAL DATABASE SCHEMA ERROR: Physical PostgreSQL tables are missing!', {
        missingTables: readiness.missingTables,
        pendingMigrations: readiness.pendingMigrations,
      });
      process.exit(1);
    }
    logger.info('✅ Database schema verified 100% READY');
  } catch (migErr) {
    logger.error('🚨 FATAL: Database migration execution failed on API startup', {
      error: (migErr as Error).message,
    });
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Graceful Shutdown Hooks
  app.enableShutdownHooks();

  // API Versioning (/api/v1/...)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Interceptors & Exception Filter
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Input Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    })
  );

  // Swagger Documentation Setup
  if (config.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  // Bind to Port (API app concern)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = '0.0.0.0';
  await app.listen(port, host);

  logger.info(`🚀 API Server running on http://${host}:${port} [env=${config.NODE_ENV}]`);
  if (config.NODE_ENV !== 'production') {
    logger.info(`📚 Swagger Documentation available at http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
