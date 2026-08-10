import { deleteSecureItem, getSecureItem, setSecureItem } from '../storage/secure-store';

const ACCESS_TOKEN_KEY = 'M_SQUARE_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'M_SQUARE_REFRESH_TOKEN';

export async function getAccessToken(): Promise<string | null> {
  return await getSecureItem(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  await setSecureItem(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return await getSecureItem(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await setSecureItem(REFRESH_TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  await deleteSecureItem(ACCESS_TOKEN_KEY);
  await deleteSecureItem(REFRESH_TOKEN_KEY);
}
