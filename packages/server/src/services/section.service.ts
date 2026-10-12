/**
 * Section service: business logic for section CRUD.
 *
 * Sections belong to a project. Deletion nullifies section_id on tasks
 * (handled by Prisma's onDelete: SetNull on the Task->Section relation).
 * Uses integer ordering with ORDER_GAP (ADR-003).
 */

import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import { ErrorCode, ORDER_GAP } from '@karya/shared';
import type { CreateSectionInput, UpdateSectionInput } from '@karya/shared';

const sectionSelect = {
  id: true,
  projectId: true,
  name: true,
  order: true,
  isCollapsed: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Verify a project belongs to the user. Throws NOT_FOUND if it doesn't.
 */
async function verifyProjectOwnership(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });

  if (!project) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
  }

  return project;
}

/**
 * List all sections in a project, ordered by `order` ascending.
 */
export async function listSections(userId: string, projectId: string) {
  await verifyProjectOwnership(userId, projectId);

  return prisma.section.findMany({
    where: { projectId },
    select: sectionSelect,
    orderBy: { order: 'asc' },
  });
}

/**
 * Create a section in a project. Auto-assigns order.
 */
export async function createSection(
  userId: string,
  projectId: string,
  input: CreateSectionInput,
) {
  await verifyProjectOwnership(userId, projectId);

  // Get the highest order value in this project's sections
  const lastSection = await prisma.section.findFirst({
    where: { projectId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const nextOrder = (lastSection?.order ?? 0) + ORDER_GAP;

  return prisma.section.create({
    data: {
      id: uuid(),
      projectId,
      name: input.name,
      order: nextOrder,
    },
    select: sectionSelect,
  });
}

/**
 * Update a section. Verifies the section's project belongs to the user.
 */
export async function updateSection(
  userId: string,
  sectionId: string,
  input: UpdateSectionInput,
) {
  // Find section and verify ownership through the project relation
  const section = await prisma.section.findFirst({
    where: { id: sectionId },
    select: { id: true, project: { select: { userId: true } } },
  });

  if (!section || section.project.userId !== userId) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Section not found');
  }

  return prisma.section.update({
    where: { id: sectionId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.isCollapsed !== undefined && { isCollapsed: input.isCollapsed }),
    },
    select: sectionSelect,
  });
}

/**
 * Delete a section. Tasks in the section have their section_id set to null
 * (handled by Prisma's onDelete: SetNull).
 * Verifies ownership through the project relation.
 */
export async function deleteSection(userId: string, sectionId: string) {
  const section = await prisma.section.findFirst({
    where: { id: sectionId },
    select: { id: true, project: { select: { userId: true } } },
  });

  if (!section || section.project.userId !== userId) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Section not found');
  }

  // Prisma onDelete: SetNull on Task->Section handles nullifying task.sectionId
  await prisma.section.delete({ where: { id: sectionId } });
}
