/**
 * Global error handling middleware and AppError class.
 */

import type { Request, Response, NextFunction } from 'express';
import { ErrorCode, ERROR_STATUS_MAP } from '@karya/shared';
import type { ApiErrorDetail } from '@karya/shared';
import { logger } from '../lib/logger.js';

/** Application error with a structured error code. */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ApiErrorDetail[];

  constructor(code: ErrorCode, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code] ?? 500;
    this.details = details;
  }
}

/**
 * Express error handler. Must be registered with all four parameters
 * so Express recognizes it as an error handler.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // Log unexpected errors
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    name: err.name,
  });

  res.status(500).json({
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
  });
}
