/**
 * Rate limiting middleware configurations (ADR-008).
 */

import rateLimit from 'express-rate-limit';
import {
  RATE_LIMIT_GENERAL,
  RATE_LIMIT_LOGIN,
  RATE_LIMIT_SIGNUP,
  RATE_LIMIT_RESEND,
  RATE_LIMIT_EXPORT,
  ErrorCode,
} from '@karya/shared';

const rateLimitResponse = {
  error: {
    code: ErrorCode.RATE_LIMITED,
    message: 'Too many requests. Please try again later.',
  },
};

/** General rate limit: 100 requests per minute per IP. */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_GENERAL.windowMs,
  max: RATE_LIMIT_GENERAL.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

/** Login rate limit: 10 attempts per 15 minutes per IP. */
export const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_LOGIN.windowMs,
  max: RATE_LIMIT_LOGIN.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

/** Signup rate limit: 5 attempts per 15 minutes per IP. */
export const signupLimiter = rateLimit({
  windowMs: RATE_LIMIT_SIGNUP.windowMs,
  max: RATE_LIMIT_SIGNUP.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

/** Resend verification rate limit: 3 per hour per IP. */
export const resendLimiter = rateLimit({
  windowMs: RATE_LIMIT_RESEND.windowMs,
  max: RATE_LIMIT_RESEND.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

/** Data export rate limit: 1 per hour per IP. */
export const exportLimiter = rateLimit({
  windowMs: RATE_LIMIT_EXPORT.windowMs,
  max: RATE_LIMIT_EXPORT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});
