import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { RequestContext } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const rawHeader = req.header('x-request-id');
    const requestId =
      rawHeader && rawHeader.trim() ? rawHeader.trim() : `req_${randomUUID().replace(/-/g, '')}`;

    res.setHeader('X-Request-ID', requestId);

    const store = {
      requestId,
      correlationId: requestId,
    };

    RequestContext.run(store, () => next());
  }
}
