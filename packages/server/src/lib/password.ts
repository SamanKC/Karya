/**
 * Password hashing with Argon2id (ADR-007).
 *
 * Parameters: memory 64 MiB, iterations 3, parallelism 1.
 * These follow current OWASP recommendations.
 */

import argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 1,
};

/** Hash a plaintext password with Argon2id. */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

/** Verify a plaintext password against an Argon2id hash. */
export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
