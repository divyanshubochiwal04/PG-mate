// ---------------------------------------------------------------------------
// Sensitive & PII key registry — all keys matched case-insensitively.
// Any log field whose key matches will be replaced with '[REDACTED]'.
// ---------------------------------------------------------------------------
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'token',
  'refresh_token',
  'refreshtoken',
  'access_token',
  'accesstoken',
  'secret',
  'jwt',
  'authorization',
  'cookie',
  'api_key',
  'apikey',
  'private_key',
  'privatekey',
  'database_url',
  'databaseurl',
  'connection_string',
  'connectionstring',
  'cardnumber',
  'card_number',
  'cvv',
  'cvc',
  'pin',
  // Resident PII Redaction Additions (M6)
  'phone',
  'alternate_phone',
  'alternatephone',
  'email',
  'date_of_birth',
  'dateofbirth',
  'address_line1',
  'addressline1',
  'emergency_contacts',
  'emergencycontacts',
]);

/**
 * Recursively redacts sensitive keys from any value.
 * Uses a WeakSet to detect and break circular references safely.
 * Exported for direct unit testing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function redactSensitiveData(obj: any, visited = new WeakSet()): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Circular reference guard
  if (visited.has(obj)) {
    return '[Circular]';
  }
  visited.add(obj);

  // Handle Error objects — extract safe enumerable properties
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
    };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, visited));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const redacted: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactSensitiveData(obj[key], visited);
    }
  }

  // Preserve Symbol properties (e.g. Winston's internal level/message symbols)
  const symbols = Object.getOwnPropertySymbols(obj);
  for (const sym of symbols) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (redacted as any)[sym] = (obj as any)[sym];
  }

  return redacted;
}
