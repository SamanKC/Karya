/**
 * User service: profile management and data export.
 */

import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error-handler.js';
import { ErrorCode } from '@karya/shared';
import type { UpdateUserInput } from '@karya/shared';

const userSelect = {
  id: true,
  email: true,
  name: true,
  timezone: true,
  createdAt: true,
} as const;

/**
 * Get the current user's profile.
 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
  }

  return user;
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(userId: string, input: UpdateUserInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
    },
    select: userSelect,
  });

  return user;
}

/**
 * Export all user data as a JSON object.
 */
export async function exportData(userId: string) {
  const [user, projects, sections, tasks, labels] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    }),
    prisma.project.findMany({
      where: { userId },
      select: {
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
      },
      orderBy: { order: 'asc' },
    }),
    prisma.section.findMany({
      where: { project: { userId } },
      select: {
        id: true,
        projectId: true,
        name: true,
        order: true,
        isCollapsed: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { order: 'asc' },
    }),
    prisma.task.findMany({
      where: { project: { userId } },
      include: {
        labels: {
          select: {
            label: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.label.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        color: true,
        order: true,
        isFavorite: true,
        createdAt: true,
      },
      orderBy: { order: 'asc' },
    }),
  ]);

  // Format tasks with labels
  const formattedTasks = tasks.map((task: typeof tasks[number]) => {
    const { labels: taskLabels, ...rest } = task;
    return {
      ...rest,
      labels: taskLabels.map((tl: typeof taskLabels[number]) => tl.label),
    };
  });

  return {
    exportedAt: new Date().toISOString(),
    user,
    projects,
    sections,
    tasks: formattedTasks,
    labels,
  };
}
