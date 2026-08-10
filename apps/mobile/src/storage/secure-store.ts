/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  SecureStore = null;
}

const memoryStore = new Map<string, string>();

export async function getSecureItem(key: string): Promise<string | null> {
  if (SecureStore && typeof SecureStore.getItemAsync === 'function') {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStore.get(key) || null;
    }
  }
  return memoryStore.get(key) || null;
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (SecureStore && typeof SecureStore.setItemAsync === 'function') {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch {
      memoryStore.set(key, value);
      return;
    }
  }
  memoryStore.set(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch {
      memoryStore.delete(key);
      return;
    }
  }
  memoryStore.delete(key);
}
