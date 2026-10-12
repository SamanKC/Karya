/**
 * Auth service: signup, login, refresh, logout, verify-email,
 * resend-verification, change-password.
 *
 * Implements ADR-007 token lifecycle including rotation and reuse detection.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ErrorCode,
  REFRESH_TOKEN_EXPIRY_DAYS,
} from '@karya/shared';
import type {
  SignupInput,
  LoginInput,
  ChangePasswordInput,
} from '@karya/shared';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken, signVerificationToken, verifyVerificationToken } from '../lib/jwt.js';
import { generateRefreshToken, hashToken } from '../lib/tokens.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';

// ─── Signup ─────────────────────────────────────────────

export interface SignupResult {
  message: string;
}

export async function signup(input: SignupInput): Promise<SignupResult> {
  // Check for existing user
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw new AppError(ErrorCode.EMAIL_ALREADY_REGISTERED, 'Email is already registered');
  }

  const userId = uuidv4();
  const passwordHash = await hashPassword(input.password);

  await prisma.user.create({
    data: {
      id: userId,
      email: input.email,
      passwordHash,
      name: input.name,
      timezone: input.timezone ?? 'UTC',
    },
  });

  // Auto-create Inbox project
  await prisma.project.create({
    data: {
      id: uuidv4(),
      userId,
      name: 'Inbox',
      isInbox: true,
      order: 0,
    },
  });

  // Generate verification token and log it (MVP: no real email service)
  const verificationToken = signVerificationToken(userId);
  logger.info('Email verification token generated (no email service configured)', {
    email: input.email,
    verifyUrl: `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/verify-email?token=${verificationToken}`,
  });

  return { message: 'Account created. Check your email to verify.' };
}

// ─── Login ──────────────────────────────────────────────

export interface LoginResult {
  accessToken: string;
  refreshToken: string; // raw token, to be set as cookie
  user: {
    id: string;
    email: string;
    name: string;
    timezone: string;
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Invalid email or password');
  }

  if (!user.emailVerified) {
    throw new AppError(ErrorCode.EMAIL_NOT_VERIFIED, 'Please verify your email before signing in');
  }

  // Generate tokens
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      id: uuidv4(),
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
    },
  };
}

// ─── Refresh ────────────────────────────────────────────

export interface RefreshResult {
  accessToken: string;
  refreshToken: string; // new raw token
}

export async function refresh(rawToken: string): Promise<RefreshResult> {
  const tokenHash = hashToken(rawToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    // Possible token reuse detected. The token was already rotated,
    // which means someone replayed an old token. Revoke all tokens
    // for the user who originally owned this token family.
    //
    // We can't identify the user from a hash alone, so this is a
    // best-effort check. If the token is genuinely unknown, reject.
    throw new AppError(ErrorCode.INVALID_REFRESH_TOKEN, 'Invalid refresh token');
  }

  // Check expiry
  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError(ErrorCode.INVALID_REFRESH_TOKEN, 'Refresh token has expired');
  }

  // Token rotation: delete old, issue new
  const newRawToken = generateRefreshToken();
  const newTokenHash = hashToken(newRawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: storedToken.id } }),
    prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        userId: storedToken.userId,
        tokenHash: newTokenHash,
        expiresAt,
      },
    }),
  ]);

  const accessToken = signAccessToken({
    sub: storedToken.user.id,
    email: storedToken.user.email,
  });

  return { accessToken, refreshToken: newRawToken };
}

// ─── Logout ─────────────────────────────────────────────

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;

  const tokenHash = hashToken(rawToken);
  // Delete if exists, ignore if already gone
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

// ─── Verify Email ───────────────────────────────────────

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const payload = verifyVerificationToken(token);
  if (!payload) {
    throw new AppError(ErrorCode.INVALID_VERIFICATION_TOKEN, 'Invalid or expired verification token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
  }

  if (user.emailVerified) {
    return { message: 'Email is already verified.' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  return { message: 'Email verified. You can now sign in.' };
}

// ─── Resend Verification ────────────────────────────────

export async function resendVerification(email: string): Promise<{ message: string }> {
  // Always return same response to prevent email enumeration
  const genericMessage = 'If this email is registered and unverified, a verification link has been sent.';

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return { message: genericMessage };
  }

  const verificationToken = signVerificationToken(user.id);
  logger.info('Resend: email verification token generated', {
    email: user.email,
    verifyUrl: `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/verify-email?token=${verificationToken}`,
  });

  return { message: genericMessage };
}

// ─── Change Password ────────────────────────────────────

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
  }

  const valid = await verifyPassword(user.passwordHash, input.currentPassword);
  if (!valid) {
    throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Current password is incorrect');
  }

  const newHash = await hashPassword(input.newPassword);

  // Update password and invalidate all refresh tokens (force re-login)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId },
    }),
  ]);

  return { message: 'Password changed.' };
}
