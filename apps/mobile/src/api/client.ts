import axios from 'axios';
import { getApiBaseUrl } from '../config/env';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../auth/token.manager';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];
let onUnauthenticatedHandler: (() => void) | null = null;

export function setUnauthenticatedHandler(handler: () => void): void {
  onUnauthenticatedHandler = handler;
}

function processQueue(error: Error | null, token: string | null = null): void {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Request Interceptor — inject Bearer token & ensure fresh baseURL
apiClient.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
  const token = await getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor — handles 401 token refresh mutex queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not attempt token refresh if 401 came from auth login or refresh endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken =
          refreshResponse.data?.data?.accessToken || refreshResponse.data?.accessToken;
        const newRefreshToken =
          refreshResponse.data?.data?.refreshToken || refreshResponse.data?.refreshToken;

        if (!newAccessToken || !newRefreshToken) {
          throw new Error('Invalid refresh response payload');
        }

        await setAccessToken(newAccessToken);
        await setRefreshToken(newRefreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as Error, null);
        await clearTokens();
        onUnauthenticatedHandler?.();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
