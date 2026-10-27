/**
 * 404 Not Found page for unknown routes.
 */

import { Link } from 'react-router-dom';
import { APP_NAME } from '@karya/shared';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="text-center">
        <h1 className="font-display text-6xl font-medium text-brand-500">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-ink">Page not found</h2>
        <p className="mt-2 text-sm text-sidebar-muted">
          The page you're looking for doesn't exist in {APP_NAME}.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/inbox" className="btn-primary">
            Go to Inbox
          </Link>
          <Link
            to="/today"
            className="rounded-lg border border-surface-border bg-surface-primary px-4 py-2 text-sm font-medium text-ink hover:bg-sidebar-hover transition-colors"
          >
            View Today
          </Link>
        </div>
      </div>
    </div>
  );
}
