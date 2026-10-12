/**
 * Search routes: /api/v1/search
 *
 * GET /  - Search across tasks and projects
 *
 * Requires authentication.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { searchQuerySchema } from '@karya/shared';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as searchService from '../services/search.service.js';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(requireAuth);

// GET /api/v1/search?q=...&type=all
router.get(
  '/',
  validate(searchQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await searchService.search(req.user!.id, req.query as any);
    res.json(result);
  }),
);

export default router;
