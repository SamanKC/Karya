/**
 * Authentication middleware.
 *
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches user info to the request context.
 */

import type { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '@karya/shared';
import { verifyAccessToken } from '../lib/jwt.js';
import { AppError } from './error-handler.js';

/** Authenticated user context attached to every request by auth middleware. */
export interface AuthUser {
  id: string;
  email: string;
}

/** Extend Express Request with authenticated user. */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Require a valid access token. Rejects with 401 if missing or invalid.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(ErrorCode.UNAUTHORIZED, 'Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);
  if (!payload) {
    throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid or expired access token');
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
  };

  next();
}
