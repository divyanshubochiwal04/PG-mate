/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
let Constants: any = null;
try {
  Constants = require('expo-constants').default;
} catch {
  Constants = null;
}

import { Platform } from 'react-native';

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

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3000/api/v1`;
  }

  const hostUri =
    Constants?.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000/api/v1`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.87.2.159:3000/api/v1';
  }

  return 'http://localhost:3000/api/v1';
}

export const env = {
  get API_BASE_URL() {
    return getApiBaseUrl();
  },
};
