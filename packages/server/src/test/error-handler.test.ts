/**
 * Unit tests for AppError and errorHandler middleware.
 */

import { describe, it, expect, vi } from 'vitest';
import { AppError, errorHandler } from '../middleware/error-handler.js';
import { ErrorCode } from '@karya/shared';
import type { Request, Response, NextFunction } from 'express';

function mockResponse(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const mockReq = {} as Request;
const mockNext = vi.fn() as unknown as NextFunction;

describe('AppError', () => {
  it('sets code, message, and statusCode from ERROR_STATUS_MAP', () => {
    const err = new AppError(ErrorCode.VALIDATION_ERROR, 'Bad input');
    expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(err.message).toBe('Bad input');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('AppError');
  });

  it('defaults to 500 for unknown error codes', () => {
    const err = new AppError('UNKNOWN_CODE' as ErrorCode, 'Something');
    expect(err.statusCode).toBe(500);
  });

  it('carries optional details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const err = new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid', details);
    expect(err.details).toEqual(details);
  });

  it('has no details when not provided', () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'Not found');
    expect(err.details).toBeUndefined();
  });
});

describe('errorHandler', () => {
  it('returns structured JSON for AppError', () => {
    const err = new AppError(ErrorCode.NOT_FOUND, 'Task not found');
    const res = mockResponse();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'Task not found',
      },
    });
  });

  it('includes details in response when present', () => {
    const details = [{ field: 'name', message: 'Required' }];
    const err = new AppError(ErrorCode.VALIDATION_ERROR, 'Validation failed', details);
    const res = mockResponse();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details,
      },
    });
  });

  it('returns 500 with generic message for unexpected errors', () => {
    const err = new Error('Database crashed');
    const res = mockResponse();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    });
  });
});
