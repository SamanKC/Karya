import { z } from 'zod';
import { MAX_CONTENT_LENGTH, MAX_DESCRIPTION_LENGTH } from '../constants.js';

const priorityEnum = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

/**
 * Date string in YYYY-MM-DD format.
 * Validates the format but not calendar correctness (e.g., Feb 30).
 */
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format');

/** ISO 8601 datetime string. */
const datetimeString = z.string().datetime({ message: 'Must be a valid ISO 8601 datetime' });

export const createTaskSchema = z.object({
  content: z.string().min(1).max(MAX_CONTENT_LENGTH).transform((v) => v.trim()),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).nullable().optional().default(null),
  projectId: z.string().uuid().optional(),
  sectionId: z.string().uuid().nullable().optional().default(null),
  parentId: z.string().uuid().nullable().optional().default(null),
  priority: priorityEnum.optional().default(1),
  dueDate: dateString.nullable().optional().default(null),
  dueDatetime: datetimeString.nullable().optional().default(null),
  dueTimezone: z.string().min(1).max(100).nullable().optional().default(null),
  labelIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateTaskSchema = z.object({
  content: z.string().min(1).max(MAX_CONTENT_LENGTH).transform((v) => v.trim()).optional(),
  description: z.string().max(MAX_DESCRIPTION_LENGTH).nullable().optional(),
  projectId: z.string().uuid().optional(),
  sectionId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  priority: priorityEnum.optional(),
  dueDate: dateString.nullable().optional(),
  dueDatetime: datetimeString.nullable().optional(),
  dueTimezone: z.string().min(1).max(100).nullable().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  order: z.number().int().optional(),
});

export const taskQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  completed: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  dueBefore: dateString.optional(),
  dueAfter: dateString.optional(),
  priority: z.coerce.number().pipe(priorityEnum).optional(),
  labelId: z.string().uuid().optional(),
  search: z.string().min(2).max(255).optional(),
});

export const todayQuerySchema = z.object({
  timezone: z.string().min(1).max(100),
});

export const upcomingQuerySchema = z.object({
  timezone: z.string().min(1).max(100),
  days: z.coerce.number().int().min(1).max(90).optional().default(14),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
export type TodayQueryInput = z.infer<typeof todayQuerySchema>;
export type UpcomingQueryInput = z.infer<typeof upcomingQuerySchema>;
