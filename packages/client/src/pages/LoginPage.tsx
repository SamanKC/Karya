/**
 * Login page with email/password form.
 * Redirects to the originally requested page (or /inbox) on success.
 */

import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { APP_NAME, MIN_PASSWORD_LENGTH } from '@karya/shared';
import { ApiClientError } from '../lib/api-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/inbox';

  const isValid = email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError('Please enter a valid email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === 'EMAIL_NOT_VERIFIED') {
          setError('Please verify your email before logging in.');
        } else if (err.code === 'INVALID_CREDENTIALS') {
          setError('Invalid email or password.');
        } else if (err.code === 'RATE_LIMITED') {
          setError('Too many login attempts. Please try again later.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="wordmark">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-sidebar-muted">Plan less. Accomplish more.</p>
        </div>

        <div className="rounded-xl bg-surface-primary p-6 shadow-sm border border-surface-border">
          <h2 className="mb-4 text-base font-semibold text-ink">Log in</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-[#f7e9e4] px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" disabled={loading || !isValid} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-sidebar-muted">
            Don't have an account?{' '}
            <Link to="/signup" className="link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
