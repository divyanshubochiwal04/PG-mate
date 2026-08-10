import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { logger } from '@m-square/logger';
import { RequestContext } from '../context/request-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
          requestId: RequestContext.requestId,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
        });
      })
    );
  }
}
