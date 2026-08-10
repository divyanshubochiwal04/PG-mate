import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '@m-square/domain';
import { logger } from '@m-square/logger';
import { RequestContext } from '../context/request-context';
import type { ApiErrorResponse, ApiFieldError } from '@m-square/contracts';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = RequestContext.requestId;
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: ApiFieldError[] | Record<string, unknown> | undefined;

    if (exception instanceof DomainError) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody = exception.getResponse();

      if (typeof resBody === 'string') {
        message = resBody;
      } else if (typeof resBody === 'object' && resBody !== null) {
        const bodyObj = resBody as Record<string, unknown>;
        message = (bodyObj['message'] as string) || exception.message;
        errorCode = (bodyObj['error'] as string) || 'HTTP_ERROR';

        if (Array.isArray(bodyObj['message'])) {
          errorCode = 'VALIDATION_ERROR';
          message = 'Validation failed';
          details = (bodyObj['message'] as string[]).map((msg) => ({
            field: 'request',
            message: msg,
          }));
        }
      }
    } else {
      // Unhandled / Internal exception — log safely via @m-square/logger
      logger.error('Unhandled API exception', {
        requestId,
        error: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        requestId,
        timestamp,
      },
    };

    response.status(status).json(payload);
  }
}
