/**
 * API client with JWT access token management.
 *
 * - Access token stored in memory (not localStorage) per ADR-007.
 * - Refresh token in HTTP-only cookie (handled by browser).
 * - Auto-refreshes on 401 responses, retrying the original request once.
 * - All requests go through the Vite proxy (/api -> localhost:3001).
 */

import { API_PREFIX } from '@karya/shared';
import type { ApiError } from '@karya/shared';

// ── Token storage (in-memory only) ──────────────────────────

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// ── Error class ─────────────────────────────────────────────

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// ── Refresh logic ───────────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // send refresh cookie
      });

      if (!res.ok) {
        setAccessToken(null);
        return false;
      }

      const data = await res.json();
      setAccessToken(data.accessToken);
      return true;
    } catch {
      setAccessToken(null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ── Core fetch wrapper ──────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /** Skip auth header (for login/signup) */
  noAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers: extraHeaders, noAuth } = options;

  // Build URL with query params
  let url = `${API_PREFIX}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (!noAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include', // always send cookies for refresh token
  });

  // Handle 401: try refresh once, then retry
  if (res.status === 401 && !noAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry with new token
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retryRes = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });

      if (retryRes.ok) {
        // Handle 204 No Content
        if (retryRes.status === 204) return undefined as T;
        return retryRes.json();
      }

      const retryError: ApiError = await retryRes.json().catch(() => ({
        error: { code: 'UNKNOWN', message: 'Request failed' },
      }));
      throw new ApiClientError(
        retryError.error.code,
        retryError.error.message,
        retryRes.status,
        retryError.error.details,
      );
    }

    // Refresh failed: throw unauthorized
    throw new ApiClientError('UNAUTHORIZED', 'Session expired', 401);
  }

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json();
  }

  const errorBody: ApiError = await res.json().catch(() => ({
    error: { code: 'UNKNOWN', message: 'Request failed' },
  }));
  throw new ApiClientError(
    errorBody.error.code,
    errorBody.error.message,
    res.status,
    errorBody.error.details,
  );
}

// ── Public API methods ──────────────────────────────────────

export const api = {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return request<T>(path, { params });
  },

  post<T>(path: string, body?: unknown, options?: { noAuth?: boolean }) {
    return request<T>(path, { method: 'POST', body, ...options });
  },

  patch<T>(path: string, body?: unknown) {
    return request<T>(path, { method: 'PATCH', body });
  },

  delete<T = void>(path: string) {
    return request<T>(path, { method: 'DELETE' });
  },
};
