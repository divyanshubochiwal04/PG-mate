import * as crypto from 'crypto';

/**
 * Compares two strings in constant time to prevent timing attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    // Perform a dummy timingSafeEqual comparison on identical strings
    // to maintain consistent execution timing.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
