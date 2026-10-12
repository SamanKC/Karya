/**
 * TanStack Query hooks for all API endpoints.
 *
 * Follows the pattern:
 *   - Query keys namespaced by domain
 *   - useQuery for reads, useMutation for writes
 *   - Mutations invalidate related queries on success
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { api } from '../lib/api-client';
import type {
  // Auth
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  // User
  UserResponse,
  UpdateUserRequest,
  // Project
  ProjectResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  // Section
  SectionResponse,
  CreateSectionRequest,
  UpdateSectionRequest,
  // Task
  TaskResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpcomingResponse,
  // Label
  LabelResponse,
  CreateLabelRequest,
  UpdateLabelRequest,
  // Search
  SearchResponse,
  SearchType,
} from '@karya/shared';

// ── Query Keys ──────────────────────────────────────────────

export const queryKeys = {
  // Auth
  user: ['user'] as const,

  // Projects
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,

  // Sections
  sections: (projectId: string) => ['sections', projectId] as const,

  // Tasks
  tasks: (params?: Record<string, unknown>) => ['tasks', params ?? {}] as const,
  task: (id: string) => ['tasks', 'detail', id] as const,
  todayTasks: (timezone: string) => ['tasks', 'today', timezone] as const,
  upcomingTasks: (timezone: string, days?: number) =>
    ['tasks', 'upcoming', timezone, days] as const,

  // Labels
  labels: ['labels'] as const,

  // Search
  search: (q: string, type?: string) => ['search', q, type] as const,
};

// ── Auth Mutations ──────────────────────────────────────────

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<LoginResponse>('/auth/login', data, { noAuth: true }),
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: (data: SignupRequest) =>
      api.post<SignupResponse>('/auth/signup', data, { noAuth: true }),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) =>
      api.post<VerifyEmailResponse>('/auth/verify-email', { token }, { noAuth: true }),
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post<ResendVerificationResponse>('/auth/resend-verification', { email }, { noAuth: true }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      api.post<ChangePasswordResponse>('/auth/change-password', data),
  });
}

// ── User ────────────────────────────────────────────────────

export function useCurrentUser(
  options?: Omit<UseQueryOptions<UserResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.get<UserResponse>('/users/me'),
    ...options,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserRequest) =>
      api.patch<UserResponse>('/users/me', data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user, data);
    },
  });
}

// ── Projects ────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => api.get<ProjectResponse[]>('/projects'),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => api.get<ProjectResponse>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectRequest) =>
      api.post<ProjectResponse>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProjectRequest & { id: string }) =>
      api.patch<ProjectResponse>(`/projects/${id}`, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.project(data.id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// ── Sections ────────────────────────────────────────────────

export function useSections(projectId: string) {
  return useQuery({
    queryKey: queryKeys.sections(projectId),
    queryFn: () => api.get<SectionResponse[]>(`/projects/${projectId}/sections`),
    enabled: !!projectId,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, ...data }: CreateSectionRequest & { projectId: string }) =>
      api.post<SectionResponse>(`/projects/${projectId}/sections`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sections(variables.projectId),
      });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId, ...data }: UpdateSectionRequest & { id: string; projectId: string }) =>
      api.patch<SectionResponse>(`/sections/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sections(variables.projectId),
      });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      api.delete(`/sections/${id}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sections(variables.projectId),
      });
    },
  });
}

// ── Tasks ───────────────────────────────────────────────────

export function useTasks(
  params?: Record<string, string | number | boolean | undefined>,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => api.get<TaskResponse[]>('/tasks', params),
    ...options,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => api.get<TaskResponse>(`/tasks/${id}`),
    enabled: !!id,
  });
}

export function useTodayTasks(timezone: string) {
  return useQuery({
    queryKey: queryKeys.todayTasks(timezone),
    queryFn: () => api.get<TaskResponse[]>('/tasks/today', { timezone }),
  });
}

export function useUpcomingTasks(timezone: string, days?: number) {
  return useQuery({
    queryKey: queryKeys.upcomingTasks(timezone, days),
    queryFn: () => api.get<UpcomingResponse>('/tasks/upcoming', { timezone, days }),
  });
}

/** Invalidates all task-related queries (lists, today, upcoming). */
function invalidateAllTasks(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskRequest) =>
      api.post<TaskResponse>('/tasks', data),
    onSuccess: () => {
      invalidateAllTasks(queryClient);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTaskRequest & { id: string }) =>
      api.patch<TaskResponse>(`/tasks/${id}`, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.task(data.id), data);
      invalidateAllTasks(queryClient);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      invalidateAllTasks(queryClient);
    },
  });
}

export function useCloseTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<TaskResponse>(`/tasks/${id}/close`),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.task(data.id), data);
      invalidateAllTasks(queryClient);
    },
  });
}

export function useReopenTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<TaskResponse>(`/tasks/${id}/reopen`),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.task(data.id), data);
      invalidateAllTasks(queryClient);
    },
  });
}

// ── Labels ──────────────────────────────────────────────────

export function useLabels() {
  return useQuery({
    queryKey: queryKeys.labels,
    queryFn: () => api.get<LabelResponse[]>('/labels'),
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLabelRequest) =>
      api.post<LabelResponse>('/labels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels });
    },
  });
}

export function useUpdateLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateLabelRequest & { id: string }) =>
      api.patch<LabelResponse>(`/labels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels });
    },
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/labels/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels });
      invalidateAllTasks(queryClient); // tasks may lose label associations
    },
  });
}

// ── Search ──────────────────────────────────────────────────

export function useSearch(q: string, type: SearchType = 'all') {
  return useQuery({
    queryKey: queryKeys.search(q, type),
    queryFn: () => api.get<SearchResponse>('/search', { q, type }),
    enabled: q.length >= 2,
  });
}
