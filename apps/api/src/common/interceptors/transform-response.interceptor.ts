import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequestContext } from '../context/request-context';
import type { ApiResponse } from '@m-square/contracts';

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        meta: {
          requestId: RequestContext.requestId ?? 'unknown-request-id',
          timestamp: new Date().toISOString(),
        },
      }))
    );
  }
}
