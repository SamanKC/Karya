/**
 * User routes: /api/v1/users/*
 *
 * GET    /me        - Get current user profile
 * PATCH  /me        - Update user profile
 * GET    /me/export - Export all user data as JSON
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { updateUserSchema } from '@karya/shared';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { exportLimiter } from '../middleware/rate-limit.js';
import * as userService from '../services/user.service.js';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(requireAuth);

// GET /api/v1/users/me
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.user!.id);
    res.json(user);
  }),
);

// PATCH /api/v1/users/me
router.patch(
  '/me',
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(req.user!.id, req.body);
    res.json(user);
  }),
);

// GET /api/v1/users/me/export
router.get(
  '/me/export',
  exportLimiter,
  asyncHandler(async (req, res) => {
    const data = await userService.exportData(req.user!.id);
    res.setHeader('Content-Disposition', 'attachment; filename="karya-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  }),
);

export default router;
