/**
 * Task routes: /api/v1/tasks/*
 *
 * GET    /              - List tasks with filters
 * GET    /today         - Tasks due today or overdue
 * GET    /upcoming      - Tasks due in the next N days
 * POST   /              - Create a task
 * GET    /:id           - Get a single task
 * PATCH  /:id           - Update a task
 * DELETE /:id           - Delete a task (cascades subtasks)
 * POST   /:id/close     - Complete a task
 * POST   /:id/reopen    - Reopen a completed task
 *
 * All routes require authentication.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  todayQuerySchema,
  upcomingQuerySchema,
} from '@karya/shared';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import * as taskService from '../services/task.service.js';

const router = Router();

/** Wrap async route handlers to pass errors to Express error handler. */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// All task routes require auth
router.use(requireAuth);

// GET /api/v1/tasks/today (before /:id to avoid matching "today" as an id)
router.get(
  '/today',
  validate(todayQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const tasks = await taskService.getTodayTasks(req.user!.id, req.query as any);
    res.json(tasks);
  }),
);

// GET /api/v1/tasks/upcoming
router.get(
  '/upcoming',
  validate(upcomingQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const result = await taskService.getUpcomingTasks(req.user!.id, req.query as any);
    res.json(result);
  }),
);

// GET /api/v1/tasks
router.get(
  '/',
  validate(taskQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const tasks = await taskService.listTasks(req.user!.id, req.query as any);
    res.json(tasks);
  }),
);

// POST /api/v1/tasks
router.post(
  '/',
  validate(createTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await taskService.createTask(req.user!.id, req.body);
    res.status(201).json(task);
  }),
);

// GET /api/v1/tasks/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await taskService.getTask(req.user!.id, req.params.id);
    res.json(task);
  }),
);

// PATCH /api/v1/tasks/:id
router.patch(
  '/:id',
  validate(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await taskService.updateTask(req.user!.id, req.params.id, req.body);
    res.json(task);
  }),
);

// DELETE /api/v1/tasks/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await taskService.deleteTask(req.user!.id, req.params.id);
    res.status(204).send();
  }),
);

// POST /api/v1/tasks/:id/close
router.post(
  '/:id/close',
  asyncHandler(async (req, res) => {
    const task = await taskService.closeTask(req.user!.id, req.params.id);
    res.json(task);
  }),
);

// POST /api/v1/tasks/:id/reopen
router.post(
  '/:id/reopen',
  asyncHandler(async (req, res) => {
    const task = await taskService.reopenTask(req.user!.id, req.params.id);
    res.json(task);
  }),
);

export default router;
