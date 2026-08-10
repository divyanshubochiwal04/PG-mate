/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
let Constants: any = null;
try {
  Constants = require('expo-constants').default;
} catch {
  Constants = null;
}

export function getApiBaseUrl(): string {
  if (process.env['EXPO_PUBLIC_API_URL']) {
    return process.env['EXPO_PUBLIC_API_URL'];
  }

  const hostUri = Constants?.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:3000/api/v1`;
    }
  }

  return 'http://192.168.0.120:3000/api/v1';
}

export const env = {
  API_BASE_URL: getApiBaseUrl(),
};
