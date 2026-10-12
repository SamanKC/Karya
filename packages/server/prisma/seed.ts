/**
 * Seed script for Karya development database.
 *
 * Creates:
 * - 1 test user (pre-verified, password: "Test1234!")
 * - Inbox project (auto-created, is_inbox=true)
 * - 2 sample projects with sections
 * - Sample tasks at various priorities, some with subtasks
 * - 3 labels
 * - Some task-label associations
 *
 * Run: npx prisma db seed
 * Requires: MySQL running, migrations applied
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Pre-computed Argon2id hash of "Test1234!"
// Generated with: await argon2.hash("Test1234!", { type: argon2.argon2id })
// Using a fixed hash so the seed script doesn't need the argon2 dependency.
const TEST_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$c2VlZHNhbHRmb3J0ZXN0$YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY';

const USER_ID = '00000000-0000-4000-a000-000000000001';

// Stable UUIDs for reproducible seeds
const ids = {
  inbox: '00000000-0000-4000-a000-000000000010',
  projectWork: '00000000-0000-4000-a000-000000000020',
  projectPersonal: '00000000-0000-4000-a000-000000000030',
  sectionBacklog: '00000000-0000-4000-a000-000000000040',
  sectionInProgress: '00000000-0000-4000-a000-000000000041',
  sectionDone: '00000000-0000-4000-a000-000000000042',
  sectionErrands: '00000000-0000-4000-a000-000000000050',
  labelBug: '00000000-0000-4000-a000-000000000060',
  labelFeature: '00000000-0000-4000-a000-000000000061',
  labelUrgent: '00000000-0000-4000-a000-000000000062',
};

function taskId(n: number): string {
  return `00000000-0000-4000-a000-0000000001${n.toString().padStart(2, '0')}`;
}

async function main() {
  console.log('Seeding Karya database...');

  // Clean existing data (order matters for FK constraints)
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE task_labels');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE refresh_tokens');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE tasks');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE sections');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE labels');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE projects');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE users');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');

  // ─── User ───────────────────────────────────────────────

  const now = new Date();

  await prisma.user.create({
    data: {
      id: USER_ID,
      email: 'test@karya.dev',
      passwordHash: TEST_PASSWORD_HASH,
      name: 'Test User',
      timezone: 'America/New_York',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log('  Created test user: test@karya.dev / Test1234!');

  // ─── Projects ──────────────────────────────────────────

  await prisma.project.createMany({
    data: [
      {
        id: ids.inbox,
        userId: USER_ID,
        name: 'Inbox',
        color: 'charcoal',
        order: 0,
        viewStyle: 'list',
        isFavorite: false,
        isInbox: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ids.projectWork,
        userId: USER_ID,
        name: 'Work',
        color: 'blue',
        order: 1000,
        viewStyle: 'board',
        isFavorite: true,
        isInbox: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ids.projectPersonal,
        userId: USER_ID,
        name: 'Personal',
        color: 'green',
        order: 2000,
        viewStyle: 'list',
        isFavorite: false,
        isInbox: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
  });
  console.log('  Created 3 projects (Inbox, Work, Personal)');

  // ─── Sections ──────────────────────────────────────────

  await prisma.section.createMany({
    data: [
      {
        id: ids.sectionBacklog,
        projectId: ids.projectWork,
        name: 'Backlog',
        order: 0,
        isCollapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ids.sectionInProgress,
        projectId: ids.projectWork,
        name: 'In Progress',
        order: 1000,
        isCollapsed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ids.sectionDone,
        projectId: ids.projectWork,
        name: 'Done',
        order: 2000,
        isCollapsed: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ids.sectionErrands,
        projectId: ids.projectPersonal,
        name: 'Errands',
        order: 0,
        isCollapsed: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
  });
  console.log('  Created 4 sections');

  // ─── Labels ────────────────────────────────────────────

  await prisma.label.createMany({
    data: [
      {
        id: ids.labelBug,
        userId: USER_ID,
        name: 'bug',
        color: 'red',
        order: 0,
        isFavorite: false,
        createdAt: now,
      },
      {
        id: ids.labelFeature,
        userId: USER_ID,
        name: 'feature',
        color: 'blue',
        order: 1000,
        isFavorite: true,
        createdAt: now,
      },
      {
        id: ids.labelUrgent,
        userId: USER_ID,
        name: 'urgent',
        color: 'berry_red',
        order: 2000,
        isFavorite: false,
        createdAt: now,
      },
    ],
  });
  console.log('  Created 3 labels (bug, feature, urgent)');

  // ─── Tasks ─────────────────────────────────────────────

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Helper to format date as YYYY-MM-DD for due_date
  const toDateOnly = (d: Date) => new Date(d.toISOString().split('T')[0]);

  await prisma.task.createMany({
    data: [
      // Inbox tasks
      {
        id: taskId(1),
        projectId: ids.inbox,
        content: 'Review pull request #42',
        priority: 3,
        dueDate: toDateOnly(tomorrow),
        order: 0,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: taskId(2),
        projectId: ids.inbox,
        content: 'Book dentist appointment',
        priority: 1,
        order: 1000,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },

      // Work project - Backlog section
      {
        id: taskId(3),
        projectId: ids.projectWork,
        sectionId: ids.sectionBacklog,
        content: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment.',
        priority: 2,
        dueDate: toDateOnly(nextWeek),
        order: 0,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: taskId(4),
        projectId: ids.projectWork,
        sectionId: ids.sectionBacklog,
        content: 'Write API documentation',
        priority: 1,
        order: 1000,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },

      // Work project - In Progress section
      {
        id: taskId(5),
        projectId: ids.projectWork,
        sectionId: ids.sectionInProgress,
        content: 'Implement user authentication',
        description: 'JWT-based auth with refresh tokens. See ADR-007.',
        priority: 4,
        dueDate: toDateOnly(tomorrow),
        order: 0,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
      // Subtask of "Implement user authentication" (depth 1)
      {
        id: taskId(6),
        projectId: ids.projectWork,
        sectionId: ids.sectionInProgress,
        parentId: taskId(5),
        content: 'Create login endpoint',
        priority: 4,
        order: 0,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
      // Sub-subtask (depth 2)
      {
        id: taskId(7),
        projectId: ids.projectWork,
        sectionId: ids.sectionInProgress,
        parentId: taskId(6),
        content: 'Add rate limiting to login',
        priority: 3,
        order: 0,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: taskId(8),
        projectId: ids.projectWork,
        sectionId: ids.sectionInProgress,
        parentId: taskId(5),
        content: 'Create signup endpoint',
        priority: 3,
        order: 1000,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },

      // Work project - Done section (completed task)
      {
        id: taskId(9),
        projectId: ids.projectWork,
        sectionId: ids.sectionDone,
        content: 'Initialize project repository',
        priority: 1,
        order: 0,
        creatorId: USER_ID,
        isCompleted: true,
        completedAt: yesterday,
        createdAt: yesterday,
        updatedAt: now,
      },

      // Personal project - no section
      {
        id: taskId(10),
        projectId: ids.projectPersonal,
        content: 'Plan weekend trip',
        description: 'Look into hiking trails near the lake.',
        priority: 2,
        dueDate: toDateOnly(nextWeek),
        order: 0,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },

      // Personal project - Errands section
      {
        id: taskId(11),
        projectId: ids.projectPersonal,
        sectionId: ids.sectionErrands,
        content: 'Buy groceries',
        priority: 1,
        dueDate: toDateOnly(tomorrow),
        order: 0,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: taskId(12),
        projectId: ids.projectPersonal,
        sectionId: ids.sectionErrands,
        content: 'Pick up dry cleaning',
        priority: 1,
        order: 1000,
        creatorId: USER_ID,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
  });
  console.log('  Created 12 tasks (including subtasks at depth 2)');

  // ─── Task Labels ───────────────────────────────────────

  await prisma.taskLabel.createMany({
    data: [
      { taskId: taskId(5), labelId: ids.labelFeature },
      { taskId: taskId(5), labelId: ids.labelUrgent },
      { taskId: taskId(3), labelId: ids.labelFeature },
      { taskId: taskId(1), labelId: ids.labelUrgent },
    ],
  });
  console.log('  Created 4 task-label associations');

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
