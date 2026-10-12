/**
 * Label routes: /api/v1/labels/*
 *
 * GET    /       - List all labels
 * POST   /       - Create a label
 * PATCH  /:id    - Update a label
 * DELETE /:id    - Delete a label (cascade removes task associations)
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createLabelSchema, updateLabelSchema } from '@karya/shared';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as labelService from '../services/label.service.js';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(requireAuth);

// GET /api/v1/labels
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const labels = await labelService.listLabels(req.user!.id);
    res.json(labels);
  }),
);

// POST /api/v1/labels
router.post(
  '/',
  validate(createLabelSchema),
  asyncHandler(async (req, res) => {
    const label = await labelService.createLabel(req.user!.id, req.body);
    res.status(201).json(label);
  }),
);

// PATCH /api/v1/labels/:id
router.patch(
  '/:id',
  validate(updateLabelSchema),
  asyncHandler(async (req, res) => {
    const label = await labelService.updateLabel(req.user!.id, req.params.id, req.body);
    res.json(label);
  }),
);

// DELETE /api/v1/labels/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await labelService.deleteLabel(req.user!.id, req.params.id);
    res.status(204).send();
  }),
);

export default router;
