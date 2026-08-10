import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { RequestContextMiddleware } from './common/context/request-context.middleware';

@Module({
  imports: [HealthModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
