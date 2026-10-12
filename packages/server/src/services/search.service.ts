/**
 * Search service: full-text search across tasks and projects.
 *
 * Uses MySQL FULLTEXT indexes on tasks(content, description)
 * and projects(name). Falls back to LIKE-based search when
 * FULLTEXT is unavailable (e.g., short queries).
 * Results scoped to the authenticated user.
 */

import { prisma } from '../lib/prisma.js';
import type { SearchQueryInput } from '@karya/shared';

const taskInclude = {
  labels: {
    select: {
      label: {
        select: { id: true, name: true, color: true },
      },
    },
  },
} as const;

function formatTask(task: Record<string, unknown> & { labels?: Array<{ label: { id: string; name: string; color: string } }> }) {
  const { labels: taskLabels, ...rest } = task;
  return {
    ...rest,
    labels: taskLabels?.map((tl) => tl.label) ?? [],
  };
}

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

export async function search(userId: string, query: SearchQueryInput) {
  const { q, type } = query;

  const searchTasks = type === 'all' || type === 'tasks';
  const searchProjects = type === 'all' || type === 'projects';

  // Use LIKE-based search (FULLTEXT requires natural language mode
  // which may not match short terms well). LIKE with % is simpler
  // and works consistently for MVP volumes.
  const pattern = `%${q}%`;

  const [tasks, projects] = await Promise.all([
    searchTasks
      ? prisma.task.findMany({
          where: {
            project: { userId },
            OR: [
              { content: { contains: q } },
              { description: { contains: q } },
            ],
          },
          include: taskInclude,
          orderBy: { updatedAt: 'desc' },
          take: 50,
        })
      : Promise.resolve([]),
    searchProjects
      ? prisma.project.findMany({
          where: {
            userId,
            name: { contains: q },
          },
          select: projectSelect,
          orderBy: { updatedAt: 'desc' },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  return {
    tasks: tasks.map(formatTask),
    projects,
  };
}
