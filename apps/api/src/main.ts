import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { config } from '@m-square/config';
import { logger } from '@m-square/logger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { setupSwagger } from './common/swagger/swagger.config';

async function bootstrap(): Promise<void> {
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
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger Documentation Setup
  if (config.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  // Bind to Port (API app concern)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);

  logger.info(`🚀 API Server running on port ${port} [env=${config.NODE_ENV}]`);
  if (config.NODE_ENV !== 'production') {
    logger.info(`📚 Swagger Documentation available at http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
