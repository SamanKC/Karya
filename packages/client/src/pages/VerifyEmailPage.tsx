/**
 * Email verification page.
 * Reads the ?token= query param and calls the verify endpoint.
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { APP_NAME } from '@karya/shared';
import { api, ApiClientError } from '../lib/api-client';
import type { VerifyEmailResponse, ResendVerificationResponse } from '@karya/shared';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'no-token'>(
    token ? 'verifying' : 'no-token',
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        await api.post<VerifyEmailResponse>(
          '/auth/verify-email',
          { token },
          { noAuth: true },
        );
        setStatus('success');
      } catch (err) {
        setStatus('error');
        if (err instanceof ApiClientError) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('Verification failed. The link may have expired.');
        }
      }
    }

    verify();
  }, [token]);

  async function handleResend() {
    if (!resendEmail) return;
    setResendStatus('sending');
    try {
      await api.post<ResendVerificationResponse>(
        '/auth/resend-verification',
        { email: resendEmail },
        { noAuth: true },
      );
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{APP_NAME}</h1>

        <div className="rounded-xl bg-white p-8 shadow-sm border border-surface-border">
          {status === 'verifying' && (
            <>
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <p className="text-sm text-gray-600">Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Email verified</h2>
              <p className="mt-2 text-sm text-gray-600">
                Your account is ready. You can now log in.
              </p>
              <Link to="/login" className="btn-primary mt-6 inline-block">
                Go to login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Verification failed</h2>
              <p className="mt-2 text-sm text-gray-600">{errorMsg}</p>

              <div className="mt-6 space-y-3">
                <input
                  type="email"
                  className="input"
                  placeholder="Enter your email to resend"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
                <button
                  onClick={handleResend}
                  disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                  className="btn-secondary w-full"
                >
                  {resendStatus === 'sent' ? 'Sent!' : 'Resend verification email'}
                </button>
              </div>

              <Link to="/login" className="link mt-4 inline-block text-sm">
                Back to login
              </Link>
            </>
          )}

          {status === 'no-token' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Missing verification token</h2>
              <p className="mt-2 text-sm text-gray-600">
                This link appears to be invalid. Check your email for the correct verification link.
              </p>
              <Link to="/login" className="btn-primary mt-6 inline-block">
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
