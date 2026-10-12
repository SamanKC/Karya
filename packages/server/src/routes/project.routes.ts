/**
 * Project routes: /api/v1/projects/*
 *
 * GET    /                - List all projects
 * POST   /                - Create a project
 * GET    /:id             - Get a single project
 * PATCH  /:id             - Update a project
 * DELETE /:id             - Delete a project (cascades sections + tasks)
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createProjectSchema, updateProjectSchema } from '@karya/shared';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as projectService from '../services/project.service.js';

const router = Router();

/** Wrap async route handlers to pass errors to Express error handler. */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// All project routes require auth
router.use(requireAuth);

// GET /api/v1/projects
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await projectService.listProjects(req.user!.id);
    res.json(projects);
  }),
);

// POST /api/v1/projects
router.post(
  '/',
  validate(createProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.user!.id, req.body);
    res.status(201).json(project);
  }),
);

// GET /api/v1/projects/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await projectService.getProject(req.user!.id, req.params.id);
    res.json(project);
  }),
);

// PATCH /api/v1/projects/:id
router.patch(
  '/:id',
  validate(updateProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(
      req.user!.id,
      req.params.id,
      req.body,
    );
    res.json(project);
  }),
);

// DELETE /api/v1/projects/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await projectService.deleteProject(req.user!.id, req.params.id);
    res.status(204).send();
  }),
);

export default router;
