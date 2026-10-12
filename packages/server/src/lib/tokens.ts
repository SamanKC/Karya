/**
 * Refresh token generation and hashing (ADR-007).
 *
 * Refresh tokens are opaque random strings, stored hashed in the database.
 * SHA-256 is sufficient for hashing random tokens (no brute-force risk
 * since the token has 256 bits of entropy).
 */

import { randomBytes, createHash } from 'crypto';

/** Generate a cryptographically random opaque token (base64url, 48 bytes). */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

/** SHA-256 hash of a token for database storage. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
