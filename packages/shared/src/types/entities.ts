/**
 * Entity types matching the database schema (database-schema.md).
 * These represent the domain objects as stored in MySQL.
 */

// --- User ---

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  timezone: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** User fields safe to expose in API responses (no passwordHash). */
export type UserPublic = Omit<User, 'passwordHash'>;

// --- Project ---

export type ViewStyle = 'list' | 'board';

export interface Project {
  id: string;
  userId: string;
  name: string;
  color: string;
  parentId: string | null;
  order: number;
  viewStyle: ViewStyle;
  isFavorite: boolean;
  isInbox: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --- Section ---

export interface Section {
  id: string;
  projectId: string;
  name: string;
  order: number;
  isCollapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --- Task ---

/**
 * Priority values (ADR-002):
 *   4 = urgent (UI "p1", red)
 *   3 = high   (UI "p2", orange)
 *   2 = medium (UI "p3", blue)
 *   1 = normal (UI "p4", no color)
 */
export type Priority = 1 | 2 | 3 | 4;

export interface Task {
  id: string;
  projectId: string;
  sectionId: string | null;
  parentId: string | null;
  content: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;       // YYYY-MM-DD
  dueDatetime: string | null;   // ISO 8601 UTC
  dueTimezone: string | null;   // IANA timezone
  isCompleted: boolean;
  completedAt: Date | null;
  order: number;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Label ---

export interface Label {
  id: string;
  userId: string;
  name: string;
  color: string;
  order: number;
  isFavorite: boolean;
  createdAt: Date;
}

// --- TaskLabel (join table) ---

export interface TaskLabel {
  taskId: string;
  labelId: string;
}
