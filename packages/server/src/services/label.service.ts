/**
 * Label service: business logic for label CRUD.
 *
 * - Per-user isolation on all queries
 * - Unique label names per user (409 on conflict)
 * - Integer ordering with ORDER_GAP (ADR-003)
 * - Cascade delete removes task_labels entries (Prisma onDelete: Cascade)
 */

import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import { ErrorCode, ORDER_GAP } from '@karya/shared';
import type { CreateLabelInput, UpdateLabelInput } from '@karya/shared';

const labelSelect = {
  id: true,
  name: true,
  color: true,
  order: true,
  isFavorite: true,
  createdAt: true,
} as const;

/**
 * List all labels for a user, ordered by `order` ascending.
 */
export async function listLabels(userId: string) {
  return prisma.label.findMany({
    where: { userId },
    select: labelSelect,
    orderBy: { order: 'asc' },
  });
}

/**
 * Create a label. Name must be unique per user.
 */
export async function createLabel(userId: string, input: CreateLabelInput) {
  // Check for duplicate name
  const existing = await prisma.label.findFirst({
    where: { userId, name: input.name },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(ErrorCode.LABEL_NAME_EXISTS, 'A label with this name already exists');
  }

  // Get the highest order value
  const lastLabel = await prisma.label.findFirst({
    where: { userId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const nextOrder = (lastLabel?.order ?? 0) + ORDER_GAP;

  return prisma.label.create({
    data: {
      id: uuid(),
      userId,
      name: input.name,
      color: input.color,
      order: nextOrder,
      isFavorite: input.isFavorite,
    },
    select: labelSelect,
  });
}

/**
 * Update a label. If renaming, checks uniqueness.
 */
export async function updateLabel(
  userId: string,
  labelId: string,
  input: UpdateLabelInput,
) {
  // Verify ownership
  const existing = await prisma.label.findFirst({
    where: { id: labelId, userId },
    select: { id: true, name: true },
  });

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Label not found');
  }

  // If renaming, check uniqueness
  if (input.name && input.name !== existing.name) {
    const duplicate = await prisma.label.findFirst({
      where: { userId, name: input.name, id: { not: labelId } },
      select: { id: true },
    });
    if (duplicate) {
      throw new AppError(ErrorCode.LABEL_NAME_EXISTS, 'A label with this name already exists');
    }
  }

  return prisma.label.update({
    where: { id: labelId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.isFavorite !== undefined && { isFavorite: input.isFavorite }),
    },
    select: labelSelect,
  });
}

/**
 * Delete a label. Cascade removes all task_labels entries (Prisma handles this).
 */
export async function deleteLabel(userId: string, labelId: string) {
  const label = await prisma.label.findFirst({
    where: { id: labelId, userId },
    select: { id: true },
  });

  if (!label) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Label not found');
  }

  await prisma.label.delete({ where: { id: labelId } });
}
