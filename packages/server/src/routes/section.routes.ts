/**
 * Section routes:
 *
 * GET    /api/v1/projects/:projectId/sections   - List sections in a project
 * POST   /api/v1/projects/:projectId/sections   - Create a section
 * PATCH  /api/v1/sections/:id                   - Update a section
 * DELETE /api/v1/sections/:id                   - Delete a section (tasks go unsectioned)
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createSectionSchema, updateSectionSchema } from '@karya/shared';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as sectionService from '../services/section.service.js';

/** Wrap async route handlers to pass errors to Express error handler. */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ─── Nested routes: /api/v1/projects/:projectId/sections ───

export const nestedSectionRouter = Router({ mergeParams: true });

nestedSectionRouter.use(requireAuth);

// GET /api/v1/projects/:projectId/sections
nestedSectionRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const sections = await sectionService.listSections(
      req.user!.id,
      req.params.projectId,
    );
    res.json(sections);
  }),
);

// POST /api/v1/projects/:projectId/sections
nestedSectionRouter.post(
  '/',
  validate(createSectionSchema),
  asyncHandler(async (req, res) => {
    const section = await sectionService.createSection(
      req.user!.id,
      req.params.projectId,
      req.body,
    );
    res.status(201).json(section);
  }),
);

// ─── Top-level routes: /api/v1/sections ────────────────────

export const sectionRouter = Router();

sectionRouter.use(requireAuth);

// PATCH /api/v1/sections/:id
sectionRouter.patch(
  '/:id',
  validate(updateSectionSchema),
  asyncHandler(async (req, res) => {
    const section = await sectionService.updateSection(
      req.user!.id,
      req.params.id,
      req.body,
    );
    res.json(section);
  }),
);

// DELETE /api/v1/sections/:id
sectionRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await sectionService.deleteSection(req.user!.id, req.params.id);
    res.status(204).send();
  }),
);
