export interface NormalizedApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeApiError(err: any): NormalizedApiError {
  if (!err) {
    return { message: 'An unknown error occurred.', statusCode: 500 };
  }

  // Handle Axios response errors
  if (err.response) {
    const status = err.response.status || 500;
    const data = err.response.data;

    let message = 'An unexpected server error occurred. Please try again.';

    // 1. Extract from nested ApiErrorResponse schema: { success: false, error: { message, details, code } }
    if (data?.error?.details && Array.isArray(data.error.details) && data.error.details.length > 0) {
      message = data.error.details.map((d: any) => d.message || JSON.stringify(d)).join('\n');
    } else if (data?.error?.message) {
      message = String(data.error.message);
    } else if (data?.message) {
      const rawMsg = Array.isArray(data.message) ? data.message.join(', ') : String(data.message);
      if (rawMsg.includes('syntax for type uuid') || rawMsg.includes('QueryFailedError') || rawMsg.includes('PostgresConnection')) {
        message = 'Invalid request parameters format.';
      } else {
        message = rawMsg;
      }
    } else if (status === 400) {
      message = 'Invalid request data. Please check your inputs.';
    } else if (status === 401) {
      message = 'Your session has expired or authentication failed. Please sign in again.';
    } else if (status === 403) {
      message = 'Access denied. You do not have permission for this resource.';
    } else if (status === 404) {
      message = 'The requested record was not found.';
    } else if (status === 409) {
      message = 'This operation conflicts with the current state.';
    } else if (status === 422) {
      message = 'Unable to process the request. Please verify the submitted details.';
    } else if (status === 429) {
      message = 'Too many requests. Please slow down and try again shortly.';
    } else if (status === 503) {
      message = 'Service temporarily unavailable. Please try again.';
    } else if (status >= 500) {
      message = 'An unexpected server error occurred. Please try again later.';
    }

    return {
      message,
      statusCode: status,
      error: (typeof data?.error === 'string' ? data.error : data?.error?.code) || undefined,
    };
  }

  // Handle Network connection failures and timeouts
  if (
    err.request ||
    err.code === 'ECONNABORTED' ||
    err.code === 'ERR_NETWORK' ||
    err.message?.includes('Network Error') ||
    err.message?.includes('timeout')
  ) {
    return {
      message: 'Unable to connect to M Square server. Check your network connection.',
      statusCode: 0,
      error: 'Network Error',
    };
  }

  return {
    message: err.message || 'An error occurred.',
    statusCode: 500,
  };
}

export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  const normalized = normalizeApiError(err);
  return normalized.message || fallback;
}
