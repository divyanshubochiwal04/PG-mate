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

    let message = 'An unexpected server error occurred.';

    if (data?.message) {
      message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    } else if (status === 401) {
      message = 'Invalid email or password.';
    } else if (status === 403) {
      message = 'Access denied. You do not have permission.';
    } else if (status === 404) {
      message = 'Requested resource not found.';
    } else if (status === 409) {
      message = 'Conflict with current server state.';
    } else if (status === 429) {
      message = 'Too many requests. Please try again later.';
    }

    return {
      message,
      statusCode: status,
      error: data?.error || undefined,
    };
  }

  // Handle Network connection failures
  if (err.request || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
    return {
      message: 'Unable to connect to the server. Check your internet connection and try again.',
      statusCode: 0,
      error: 'Network Error',
    };
  }

  return {
    message: err.message || 'An error occurred.',
    statusCode: 500,
  };
}
