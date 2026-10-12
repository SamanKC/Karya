/**
 * Project service: business logic for project CRUD.
 *
 * All queries enforce per-user isolation (userId filter).
 * Uses integer ordering with ORDER_GAP (ADR-003).
 */

import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import { ErrorCode, ORDER_GAP } from '@karya/shared';
import type { CreateProjectInput, UpdateProjectInput } from '@karya/shared';

// Fields to return in project responses (exclude relation fields)
const projectSelect = {
  id: true,
  name: true,
  color: true,
  parentId: true,
  order: true,
  viewStyle: true,
  isFavorite: true,
  isInbox: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * List all projects for a user, ordered by `order` ascending.
 */
export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    select: projectSelect,
    orderBy: { order: 'asc' },
  });
}

/**
 * Get a single project by ID, scoped to the user.
 */
export async function getProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: projectSelect,
  });

  if (!project) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
  }

  return project;
}

/**
 * Create a project. Auto-assigns order based on the highest existing order.
 */
export async function createProject(userId: string, input: CreateProjectInput) {
  // If parentId is set, verify it belongs to this user
  if (input.parentId) {
    const parent = await prisma.project.findFirst({
      where: { id: input.parentId, userId },
      select: { id: true },
    });
    if (!parent) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Parent project not found');
    }
  }

  // Get the highest order value for this user's projects
  const lastProject = await prisma.project.findFirst({
    where: { userId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const nextOrder = (lastProject?.order ?? 0) + ORDER_GAP;

  const project = await prisma.project.create({
    data: {
      id: uuid(),
      userId,
      name: input.name,
      color: input.color,
      parentId: input.parentId,
      order: nextOrder,
      viewStyle: input.viewStyle,
      isFavorite: input.isFavorite,
      isInbox: false,
    },
    select: projectSelect,
  });

  return project;
}

/**
 * Update a project. Cannot modify the Inbox's isInbox flag.
 */
export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
) {
  // Verify ownership and get current state
  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, isInbox: true },
  });

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
  }

  // If parentId is being set, verify the parent belongs to this user
  // and is not the project itself
  if (input.parentId !== undefined && input.parentId !== null) {
    if (input.parentId === projectId) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'A project cannot be its own parent',
      );
    }
    const parent = await prisma.project.findFirst({
      where: { id: input.parentId, userId },
      select: { id: true },
    });
    if (!parent) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Parent project not found');
    }
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.parentId !== undefined && { parentId: input.parentId }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.viewStyle !== undefined && { viewStyle: input.viewStyle }),
      ...(input.isFavorite !== undefined && { isFavorite: input.isFavorite }),
    },
    select: projectSelect,
  });

  return project;
}

/**
 * Delete a project and cascade to its sections and tasks.
 * The Inbox project cannot be deleted.
 */
export async function deleteProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true, isInbox: true },
  });

  if (!project) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
  }

  if (project.isInbox) {
    throw new AppError(
      ErrorCode.CANNOT_DELETE_INBOX,
      'Cannot delete the Inbox project',
    );
  }

  // Prisma cascade (onDelete: Cascade) handles sections and tasks
  await prisma.project.delete({ where: { id: projectId } });
}
