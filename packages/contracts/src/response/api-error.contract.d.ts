import type { ApiResponseMeta } from './api-response.contract';
/**
 * Individual field validation failure details.
 */
export interface ApiFieldError {
    field: string;
    message: string;
}
/**
 * Structured error details payload.
 */
export interface ApiErrorDetail {
    code: string;
    message: string;
    details?: ApiFieldError[] | Record<string, unknown>;
}
/**
 * Standard API error response envelope returned to all production clients.
 */
export interface ApiErrorResponse {
    success: false;
    error: ApiErrorDetail;
    meta: ApiResponseMeta;
}
//# sourceMappingURL=api-error.contract.d.ts.map