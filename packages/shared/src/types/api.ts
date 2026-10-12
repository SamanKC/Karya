/**
 * API request/response types matching api-contracts.md.
 * All response types use camelCase per the API contract.
 */

import type { Priority, ViewStyle } from './entities.js';

// ============================================================
// Common
// ============================================================

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

/** Label summary embedded in task responses. */
export interface LabelSummary {
  id: string;
  name: string;
  color: string;
}

// ============================================================
// Auth
// ============================================================

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  timezone?: string;
}

export interface SignupResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// ============================================================
// User
// ============================================================

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  timezone: string;
  createdAt: string; // ISO 8601
}

export interface UpdateUserRequest {
  name?: string;
  timezone?: string;
}

// ============================================================
// Project
// ============================================================

export interface ProjectResponse {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  order: number;
  viewStyle: ViewStyle;
  isFavorite: boolean;
  isInbox: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  color?: string;
  parentId?: string | null;
  viewStyle?: ViewStyle;
  isFavorite?: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  color?: string;
  parentId?: string | null;
  viewStyle?: ViewStyle;
  isFavorite?: boolean;
  order?: number;
}

// ============================================================
// Section
// ============================================================

export interface SectionResponse {
  id: string;
  projectId: string;
  name: string;
  order: number;
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionRequest {
  name: string;
}

export interface UpdateSectionRequest {
  name?: string;
  order?: number;
  isCollapsed?: boolean;
}

// ============================================================
// Task
// ============================================================

export interface TaskResponse {
  id: string;
  projectId: string;
  sectionId: string | null;
  parentId: string | null;
  content: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;       // YYYY-MM-DD
  dueDatetime: string | null;   // ISO 8601
  dueTimezone: string | null;
  isCompleted: boolean;
  completedAt: string | null;   // ISO 8601
  order: number;
  creatorId: string;
  labels: LabelSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  content: string;
  description?: string | null;
  projectId?: string;
  sectionId?: string | null;
  parentId?: string | null;
  priority?: Priority;
  dueDate?: string | null;
  dueDatetime?: string | null;
  dueTimezone?: string | null;
  labelIds?: string[];
}

export interface UpdateTaskRequest {
  content?: string;
  description?: string | null;
  projectId?: string;
  sectionId?: string | null;
  parentId?: string | null;
  priority?: Priority;
  dueDate?: string | null;
  dueDatetime?: string | null;
  dueTimezone?: string | null;
  labelIds?: string[];
  order?: number;
}

export interface TaskQueryParams {
  projectId?: string;
  sectionId?: string;
  parentId?: string;
  completed?: boolean;
  dueBefore?: string;
  dueAfter?: string;
  priority?: Priority;
  labelId?: string;
  search?: string;
}

export interface TodayQueryParams {
  timezone: string;
}

export interface UpcomingQueryParams {
  timezone: string;
  days?: number;
}

export interface UpcomingDateGroup {
  date: string;      // YYYY-MM-DD
  tasks: TaskResponse[];
}

export interface UpcomingResponse {
  dates: UpcomingDateGroup[];
  overdue: TaskResponse[];
}

// ============================================================
// Label
// ============================================================

export interface LabelResponse {
  id: string;
  name: string;
  color: string;
  order: number;
  isFavorite: boolean;
  createdAt: string;
}

export interface CreateLabelRequest {
  name: string;
  color?: string;
  isFavorite?: boolean;
}

export interface UpdateLabelRequest {
  name?: string;
  color?: string;
  order?: number;
  isFavorite?: boolean;
}

// ============================================================
// Search
// ============================================================

export type SearchType = 'tasks' | 'projects' | 'all';

export interface SearchQueryParams {
  q: string;
  type?: SearchType;
}

export interface SearchResponse {
  tasks: TaskResponse[];
  projects: ProjectResponse[];
}
