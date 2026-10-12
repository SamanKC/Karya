/**
 * 404 Not Found page for unknown routes.
 */

import { Link } from 'react-router-dom';
import { APP_NAME } from '@karya/shared';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-brand-500">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Page not found</h2>
        <p className="mt-2 text-sm text-gray-500">
          The page you're looking for doesn't exist in {APP_NAME}.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/inbox" className="btn-primary">
            Go to Inbox
          </Link>
          <Link
            to="/today"
            className="rounded-lg border border-surface-border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-surface-hover transition-colors"
          >
            View Today
          </Link>
        </div>
      </div>
    </div>
  );
}
