export const PRODUCTION_API_URL = 'https://pg-mate-n5b0.onrender.com/api/v1';

let customApiBaseUrl: string | null = null;

export function setCustomApiBaseUrl(url: string | null): void {
  customApiBaseUrl = url;
}

export function getApiBaseUrl(): string {
  if (customApiBaseUrl) {
    return customApiBaseUrl;
  }

  if (process.env['EXPO_PUBLIC_API_URL']) {
    return process.env['EXPO_PUBLIC_API_URL'];
  }

  return PRODUCTION_API_URL;
}

export const env = {
  get API_BASE_URL() {
    return getApiBaseUrl();
  },
};
