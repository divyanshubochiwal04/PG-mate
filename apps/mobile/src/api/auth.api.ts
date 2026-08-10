import { apiClient } from './client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseData {
  user: {
    id: string;
    email: string;
    status: string;
    emailVerifiedAt?: string;
    lastLoginAt?: string;
    createdAt: string;
  };
  tokens: AuthTokens;
}

export async function loginApi(email: string, password: string): Promise<LoginResponseData> {
  const response = await apiClient.post<{ data: LoginResponseData }>('/auth/login', { email, password });
  return response.data.data;
}

export async function refreshTokensApi(refreshToken: string): Promise<AuthTokens> {
  const response = await apiClient.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken });
  return response.data.data;
}
