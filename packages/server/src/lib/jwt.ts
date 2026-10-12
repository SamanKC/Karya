/**
 * JWT access token and email verification token utilities (ADR-007).
 *
 * Access tokens: RS256, 15-min expiry.
 * Verification tokens: RS256, 24-hour expiry.
 *
 * RSA key pair loaded from environment variables:
 *   JWT_PRIVATE_KEY - PEM-encoded RSA private key (newlines as \n)
 *   JWT_PUBLIC_KEY  - PEM-encoded RSA public key (newlines as \n)
 */

import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_EXPIRY } from '@karya/shared';

// ─── Key loading ────────────────────────────────────────

function loadKey(envVar: string): string {
  const raw = process.env[envVar];
  if (!raw) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
  // Support keys stored with literal \n instead of actual newlines
  return raw.replace(/\\n/g, '\n');
}

let _privateKey: string | undefined;
let _publicKey: string | undefined;

function getPrivateKey(): string {
  if (!_privateKey) _privateKey = loadKey('JWT_PRIVATE_KEY');
  return _privateKey;
}

function getPublicKey(): string {
  if (!_publicKey) _publicKey = loadKey('JWT_PUBLIC_KEY');
  return _publicKey;
}

// ─── Access tokens ──────────────────────────────────────

export interface AccessTokenPayload {
  sub: string; // user ID
  email: string;
}

/** Sign an access token (15-min expiry, RS256). */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'karya',
  });
}

/** Verify and decode an access token. Returns null on failure. */
export function verifyAccessToken(
  token: string,
): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getPublicKey(), {
      algorithms: ['RS256'],
      issuer: 'karya',
    }) as jwt.JwtPayload & AccessTokenPayload;
    return { sub: decoded.sub!, email: decoded.email };
  } catch {
    return null;
  }
}

// ─── Verification tokens ────────────────────────────────

export interface VerificationTokenPayload {
  sub: string; // user ID
  purpose: 'email-verification';
}

/** Sign a verification token (24-hour expiry, RS256). */
export function signVerificationToken(userId: string): string {
  const payload: VerificationTokenPayload = {
    sub: userId,
    purpose: 'email-verification',
  };
  return jwt.sign(payload, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn: '24h',
    issuer: 'karya',
  });
}

/** Verify and decode a verification token. Returns null on failure. */
export function verifyVerificationToken(
  token: string,
): VerificationTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getPublicKey(), {
      algorithms: ['RS256'],
      issuer: 'karya',
    }) as jwt.JwtPayload & VerificationTokenPayload;
    if (decoded.purpose !== 'email-verification') return null;
    return { sub: decoded.sub!, purpose: decoded.purpose };
  } catch {
    return null;
  }
}

// ─── Testing helpers ────────────────────────────────────

/** Reset cached keys (for testing). */
export function _resetKeys(): void {
  _privateKey = undefined;
  _publicKey = undefined;
}
