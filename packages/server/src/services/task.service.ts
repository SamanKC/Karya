/**
 * Task service: business logic for task CRUD, completion, and queries.
 *
 * - Per-user isolation via project ownership check
 * - Subtask depth enforcement (max 4 levels, ADR-004)
 * - Integer ordering with ORDER_GAP (ADR-003)
 * - Content/description sanitization (ADR-008)
 * - Label association (full replace on update)
 * - Today/upcoming views with timezone-aware date resolution
 */

import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { sanitize } from '../lib/sanitize.js';
import { AppError } from '../middleware/error-handler.js';
import {
  ErrorCode,
  ORDER_GAP,
  MAX_SUBTASK_DEPTH,
  DEFAULT_UPCOMING_DAYS,
} from '@karya/shared';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryInput,
  TodayQueryInput,
  UpcomingQueryInput,
} from '@karya/shared';

// ─── Shared select/include for task responses ──────────────

const taskInclude = {
  labels: {
    select: {
      label: {
        select: { id: true, name: true, color: true },
      },
    },
  },
} as const;

/** Transform a raw Prisma task (with labels relation) into the API shape. */
function formatTask(task: Record<string, unknown> & { labels?: Array<{ label: { id: string; name: string; color: string } }> }) {
  const { labels: taskLabels, ...rest } = task;
  return {
    ...rest,
    labels: taskLabels?.map((tl) => tl.label) ?? [],
  };
}

// ─── Ownership helpers ─────────────────────────────────────

/**
 * Verify a project belongs to the user. Returns the project ID.
 */
async function verifyProjectOwnership(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
  }
  return project.id;
}

/**
 * Verify a task belongs to the user (through its project).
 */
async function findOwnedTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId },
    include: {
      project: { select: { userId: true } },
      ...taskInclude,
    },
  });

  if (!task || task.project.userId !== userId) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Task not found');
  }

  return task;
}

// ─── Subtask depth ─────────────────────────────────────────

/**
 * Calculate the depth of a task by walking up the parent chain.
 * Returns 1 for a root task, 2 for a child, etc.
 */
async function getTaskDepth(taskId: string): Promise<number> {
  let depth = 1;
  let currentId: string | null = taskId;

  while (currentId) {
    const parent: { parentId: string | null } | null = await prisma.task.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!parent?.parentId) break;
    depth++;
    currentId = parent.parentId;
  }

  return depth;
}

/**
 * Get the maximum depth of any subtree rooted at the given task.
 * Returns 0 if the task has no children.
 */
async function getSubtreeMaxDepth(taskId: string): Promise<number> {
  const children = await prisma.task.findMany({
    where: { parentId: taskId },
    select: { id: true },
  });

  if (children.length === 0) return 0;

  let maxChildDepth = 0;
  for (const child of children) {
    const childDepth = await getSubtreeMaxDepth(child.id);
    maxChildDepth = Math.max(maxChildDepth, childDepth + 1);
  }
  return maxChildDepth;
}

/**
 * Validate that assigning parentId to a task won't exceed MAX_SUBTASK_DEPTH.
 */
async function validateSubtaskDepth(
  parentId: string,
  existingTaskId?: string,
): Promise<void> {
  // Depth of parent in its chain
  const parentDepth = await getTaskDepth(parentId);

  // How deep is the subtree below the task being moved/created?
  const subtreeDepth = existingTaskId
    ? await getSubtreeMaxDepth(existingTaskId)
    : 0;

  // +1 for the task itself
  if (parentDepth + 1 + subtreeDepth > MAX_SUBTASK_DEPTH) {
    throw new AppError(
      ErrorCode.MAX_DEPTH_EXCEEDED,
      `Maximum nesting depth of ${MAX_SUBTASK_DEPTH} levels exceeded`,
    );
  }
}

// ─── Label validation ──────────────────────────────────────

/**
 * Verify all label IDs belong to the user. Returns verified IDs.
 */
async function verifyLabels(userId: string, labelIds: string[]): Promise<string[]> {
  if (labelIds.length === 0) return [];

  const labels = await prisma.label.findMany({
    where: { id: { in: labelIds }, userId },
    select: { id: true },
  });

  if (labels.length !== labelIds.length) {
    throw new AppError(ErrorCode.NOT_FOUND, 'One or more labels not found');
  }

  return labelIds;
}

// ─── Next order ────────────────────────────────────────────

async function getNextTaskOrder(projectId: string, sectionId: string | null): Promise<number> {
  const last = await prisma.task.findFirst({
    where: { projectId, sectionId: sectionId ?? null },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  return (last?.order ?? 0) + ORDER_GAP;
}

// ─── CRUD ──────────────────────────────────────────────────

export async function listTasks(userId: string, query: TaskQueryInput) {
  // Build the where clause
  const where: Record<string, unknown> = {};

  // Per-user isolation: task's project must belong to the user
  // We filter via the project relation
  where.project = { userId };

  if (query.projectId) where.projectId = query.projectId;
  if (query.sectionId) where.sectionId = query.sectionId;
  if (query.parentId) where.parentId = query.parentId;
  if (query.completed !== undefined) where.isCompleted = query.completed;
  if (query.priority) where.priority = query.priority;

  // Due date range filters
  if (query.dueBefore || query.dueAfter) {
    const dueDateFilter: Record<string, unknown> = {};
    if (query.dueBefore) dueDateFilter.lt = new Date(query.dueBefore + 'T23:59:59.999Z');
    if (query.dueAfter) dueDateFilter.gte = new Date(query.dueAfter + 'T00:00:00.000Z');
    where.dueDate = dueDateFilter;
  }

  // Label filter: tasks that have this label
  if (query.labelId) {
    where.labels = { some: { labelId: query.labelId } };
  }

  // Full-text search
  if (query.search) {
    where.OR = [
      { content: { contains: query.search } },
      { description: { contains: query.search } },
    ];
  }

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: { order: 'asc' },
  });

  return tasks.map(formatTask);
}

export async function getTask(userId: string, taskId: string) {
  const task = await findOwnedTask(userId, taskId);
  return formatTask(task);
}

export async function createTask(userId: string, input: CreateTaskInput) {
  // Resolve project: default to Inbox
  let projectId = input.projectId;
  if (!projectId) {
    const inbox = await prisma.project.findFirst({
      where: { userId, isInbox: true },
      select: { id: true },
    });
    if (!inbox) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Inbox project not found');
    }
    projectId = inbox.id;
  } else {
    await verifyProjectOwnership(userId, projectId);
  }

  // Verify section belongs to the project
  if (input.sectionId) {
    const section = await prisma.section.findFirst({
      where: { id: input.sectionId, projectId },
      select: { id: true },
    });
    if (!section) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Section not found in this project');
    }
  }

  // Verify parent task is in the same project and check depth
  if (input.parentId) {
    const parent = await prisma.task.findFirst({
      where: { id: input.parentId, projectId },
      select: { id: true },
    });
    if (!parent) {
      throw new AppError(ErrorCode.PARENT_NOT_IN_PROJECT, 'Parent task not found in this project');
    }
    await validateSubtaskDepth(input.parentId);
  }

  // Verify labels
  const labelIds = await verifyLabels(userId, input.labelIds ?? []);

  // Sanitize content and description
  const content = sanitize(input.content);
  const description = input.description ? sanitize(input.description) : null;

  const nextOrder = await getNextTaskOrder(projectId!, input.sectionId ?? null);

  const taskId = uuid();

  const task = await prisma.task.create({
    data: {
      id: taskId,
      projectId,
      sectionId: input.sectionId ?? null,
      parentId: input.parentId ?? null,
      content,
      description,
      priority: input.priority ?? 1,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      dueDatetime: input.dueDatetime ? new Date(input.dueDatetime) : null,
      dueTimezone: input.dueTimezone ?? null,
      order: nextOrder,
      creatorId: userId,
      ...(labelIds.length > 0 && {
        labels: {
          create: labelIds.map((labelId) => ({ labelId })),
        },
      }),
    },
    include: taskInclude,
  });

  return formatTask(task);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
) {
  const existing = await findOwnedTask(userId, taskId);

  // If changing project, verify ownership
  const targetProjectId = input.projectId ?? existing.projectId;
  if (input.projectId && input.projectId !== existing.projectId) {
    await verifyProjectOwnership(userId, input.projectId);
  }

  // If changing section, verify it belongs to the target project
  if (input.sectionId !== undefined && input.sectionId !== null) {
    const section = await prisma.section.findFirst({
      where: { id: input.sectionId, projectId: targetProjectId },
      select: { id: true },
    });
    if (!section) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Section not found in this project');
    }
  }

  // If changing parent, verify same project and depth
  if (input.parentId !== undefined) {
    if (input.parentId !== null) {
      if (input.parentId === taskId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'A task cannot be its own parent');
      }
      const parent = await prisma.task.findFirst({
        where: { id: input.parentId, projectId: targetProjectId },
        select: { id: true },
      });
      if (!parent) {
        throw new AppError(ErrorCode.PARENT_NOT_IN_PROJECT, 'Parent task not found in this project');
      }
      await validateSubtaskDepth(input.parentId, taskId);
    }
  }

  // Verify labels if provided
  if (input.labelIds) {
    await verifyLabels(userId, input.labelIds);
  }

  // Build update data
  const data: Record<string, unknown> = {};

  if (input.content !== undefined) data.content = sanitize(input.content);
  if (input.description !== undefined) {
    data.description = input.description ? sanitize(input.description) : null;
  }
  if (input.projectId !== undefined) data.projectId = input.projectId;
  if (input.sectionId !== undefined) data.sectionId = input.sectionId;
  if (input.parentId !== undefined) data.parentId = input.parentId;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.order !== undefined) data.order = input.order;

  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }
  if (input.dueDatetime !== undefined) {
    data.dueDatetime = input.dueDatetime ? new Date(input.dueDatetime) : null;
  }
  if (input.dueTimezone !== undefined) data.dueTimezone = input.dueTimezone;

  // Label replacement: delete all existing, create new
  if (input.labelIds) {
    await prisma.taskLabel.deleteMany({ where: { taskId } });
    if (input.labelIds.length > 0) {
      data.labels = {
        create: input.labelIds.map((labelId: string) => ({ labelId })),
      };
    }
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: taskInclude,
  });

  return formatTask(updated);
}

export async function deleteTask(userId: string, taskId: string) {
  await findOwnedTask(userId, taskId);

  // Prisma onDelete: Cascade on Task->Task (parent) handles subtask deletion
  await prisma.task.delete({ where: { id: taskId } });
}

// ─── Completion ────────────────────────────────────────────

export async function closeTask(userId: string, taskId: string) {
  const task = await findOwnedTask(userId, taskId);

  if (task.isCompleted) {
    return formatTask(task); // Idempotent
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      isCompleted: true,
      completedAt: new Date(),
    },
    include: taskInclude,
  });

  return formatTask(updated);
}

export async function reopenTask(userId: string, taskId: string) {
  const task = await findOwnedTask(userId, taskId);

  if (!task.isCompleted) {
    return formatTask(task); // Idempotent
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      isCompleted: false,
      completedAt: null,
    },
    include: taskInclude,
  });

  return formatTask(updated);
}

// ─── Today / Upcoming views ────────────────────────────────

/**
 * Get tasks due today or overdue. Uses the user's timezone to resolve "today".
 */
export async function getTodayTasks(userId: string, query: TodayQueryInput) {
  // Resolve "today" in the user's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: query.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(now); // YYYY-MM-DD

  const todayStart = new Date(todayStr + 'T00:00:00.000Z');
  const todayEnd = new Date(todayStr + 'T23:59:59.999Z');

  const tasks = await prisma.task.findMany({
    where: {
      project: { userId },
      isCompleted: false,
      dueDate: { lte: todayEnd },
    },
    include: taskInclude,
    orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { order: 'asc' }],
  });

  return tasks.map(formatTask);
}

/**
 * Get tasks due in the next N days, grouped by date, plus overdue tasks.
 */
export async function getUpcomingTasks(userId: string, query: UpcomingQueryInput) {
  const days = query.days ?? DEFAULT_UPCOMING_DAYS;

  // Resolve dates in the user's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: query.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(now);
  const todayStart = new Date(todayStr + 'T00:00:00.000Z');

  // End date: today + days
  const endDate = new Date(todayStart);
  endDate.setDate(endDate.getDate() + days);

  // Get all tasks with due dates up to endDate
  const tasks = await prisma.task.findMany({
    where: {
      project: { userId },
      isCompleted: false,
      dueDate: { lte: endDate },
    },
    include: taskInclude,
    orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { order: 'asc' }],
  });

  // Partition into overdue and date groups
  const overdue: ReturnType<typeof formatTask>[] = [];
  const dateMap = new Map<string, ReturnType<typeof formatTask>[]>();

  for (const task of tasks) {
    const formatted = formatTask(task);
    const taskDate = task.dueDate;

    if (!taskDate || taskDate < todayStart) {
      overdue.push(formatted);
    } else {
      // Format the date as YYYY-MM-DD
      const dateKey = taskDate.toISOString().slice(0, 10);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(formatted);
    }
  }

  // Convert map to sorted array
  const dates = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dateTasks]) => ({ date, tasks: dateTasks }));

  return { dates, overdue };
}
