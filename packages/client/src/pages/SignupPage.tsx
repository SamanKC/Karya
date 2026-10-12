/**
 * Signup page. On success, shows a verification notice
 * instead of logging in immediately.
 */

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, MAX_NAME_LENGTH, MAX_EMAIL_LENGTH } from '@karya/shared';
import { api, ApiClientError } from '../lib/api-client';
import type { SignupResponse } from '@karya/shared';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errs.name = 'Name is required.';
    } else if (trimmedName.length > MAX_NAME_LENGTH) {
      errs.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
    }

    if (!trimmedEmail) {
      errs.email = 'Email is required.';
    } else if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      errs.email = `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      errs.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      errs.password = `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`;
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);

    try {
      await api.post<SignupResponse>(
        '/auth/signup',
        { name, email, password },
        { noAuth: true },
      );
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.details) {
          const errs: Record<string, string> = {};
          for (const d of err.details) {
            errs[d.field] = d.message;
          }
          setFieldErrors(errs);
        } else if (err.code === 'EMAIL_ALREADY_REGISTERED') {
          setError('An account with this email already exists.');
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

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-xl bg-white p-8 shadow-sm border border-surface-border">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a verification link to <strong>{email}</strong>.
              Click the link to activate your account.
            </p>
            <Link to="/login" className="btn-primary mt-6 inline-block">
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-gray-500">Plan less. Accomplish more.</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-surface-border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create account</h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                maxLength={MAX_NAME_LENGTH}
                className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                maxLength={MAX_EMAIL_LENGTH}
                className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                maxLength={MAX_PASSWORD_LENGTH}
                className={`input ${fieldErrors.password ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.password}</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
