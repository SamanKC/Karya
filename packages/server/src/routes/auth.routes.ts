/**
 * Auth routes: /api/v1/auth/*
 *
 * POST /signup          - Create account
 * POST /login           - Sign in, receive access token + refresh cookie
 * POST /refresh         - Exchange refresh cookie for new tokens
 * POST /logout          - Invalidate refresh token
 * POST /verify-email    - Verify email with token
 * POST /resend-verification - Resend verification email
 * POST /change-password - Change password (authenticated)
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '@karya/shared';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter, signupLimiter, resendLimiter } from '../middleware/rate-limit.js';
import * as authService from '../services/auth.service.js';

const router = Router();

// ─── Helpers ────────────────────────────────────────────

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

/** Wrap async route handlers to pass errors to Express error handler. */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ─── Routes ─────────────────────────────────────────────

router.post(
  '/signup',
  signupLimiter,
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.signup(req.body);
    res.status(201).json(result);
  }),
);

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    setRefreshCookie(res, result.refreshToken);
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (!rawToken) {
      res.status(401).json({
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'No refresh token provided' },
      });
      return;
    }
    const result = await authService.refresh(rawToken);
    setRefreshCookie(res, result.refreshToken);
    res.json({ accessToken: result.accessToken });
  }),
);

router.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    await authService.logout(rawToken);
    clearRefreshCookie(res);
    res.status(204).send();
  }),
);

router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.body.token);
    res.json(result);
  }),
);

router.post(
  '/resend-verification',
  resendLimiter,
  validate(resendVerificationSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.resendVerification(req.body.email);
    res.json(result);
  }),
);

router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.changePassword(req.user!.id, req.body);
    res.json(result);
  }),
);

export default router;
