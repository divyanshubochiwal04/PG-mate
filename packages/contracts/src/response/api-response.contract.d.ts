/**
 * Standard API metadata included in every success and error response.
 */
export interface ApiResponseMeta {
    requestId: string;
    timestamp: string;
}
/**
 * Standard API success response envelope.
 */
export interface ApiResponse<T = unknown> {
    success: true;
    data: T;
    meta: ApiResponseMeta;
}
//# sourceMappingURL=api-response.contract.d.ts.map