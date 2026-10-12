/**
 * Authentication context.
 *
 * Manages the auth lifecycle:
 *   1. On mount, attempts a silent refresh to restore session.
 *   2. On login, stores access token in memory and fetches user profile.
 *   3. On logout, clears token, cookie (via API), and query cache.
 *   4. Provides isAuthenticated / isLoading / user to the tree.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAccessToken, api } from '../lib/api-client';
import type { UserResponse, LoginResponse } from '@karya/shared';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserResponse) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Silent refresh on mount to restore session from cookie
  useEffect(() => {
    let cancelled = false;

    async function tryRestore() {
      try {
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setAccessToken(data.accessToken);

        // Fetch user profile
        const profile = await api.get<UserResponse>('/users/me');
        if (!cancelled) {
          setUser(profile);
        }
      } catch {
        // No valid session, that's fine
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    tryRestore();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<LoginResponse>(
      '/auth/login',
      { email, password },
      { noAuth: true },
    );
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the API call fails, clear local state
    }
    setAccessToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
