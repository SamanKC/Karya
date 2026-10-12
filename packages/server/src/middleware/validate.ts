/**
 * Zod validation middleware.
 *
 * Validates request body (and optionally query params) against a zod schema.
 * On failure, returns a 400 with structured validation errors.
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';
import { ErrorCode } from '@karya/shared';
import { AppError } from './error-handler.js';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Returns middleware that validates `req[target]` against the given schema.
 * On success, replaces `req[target]` with the parsed (and transformed) output.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = formatZodError(result.error);
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        details,
      );
    }

    // Replace with parsed/transformed values
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}

function formatZodError(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
  }));
}
