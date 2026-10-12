/**
 * Periodic cleanup of expired refresh tokens.
 *
 * Without cleanup, the refresh_tokens table grows indefinitely as
 * tokens expire but are never used again. This runs every 6 hours
 * and deletes tokens past their expiry date.
 */

import { prisma } from './prisma.js';
import { logger } from './logger.js';

const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

let intervalId: ReturnType<typeof setInterval> | null = null;

async function cleanupExpiredTokens(): Promise<void> {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      logger.info('Cleaned up expired refresh tokens', { count: result.count });
    }
  } catch (err) {
    logger.error('Failed to clean up expired tokens', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function startTokenCleanup(): void {
  // Run once at startup, then on interval
  cleanupExpiredTokens();
  intervalId = setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS);
  intervalId.unref(); // don't prevent process exit
}

export function stopTokenCleanup(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
