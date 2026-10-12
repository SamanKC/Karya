/**
 * Root App component with React Router configuration.
 *
 * Route structure:
 *   /login           - LoginPage
 *   /signup          - SignupPage
 *   /verify-email    - VerifyEmailPage
 *   /                - redirects to /inbox
 *   /inbox           - InboxPage (protected)
 *   /today           - TodayPage (protected)
 *   /upcoming        - UpcomingPage (protected)
 *   /project/:id     - ProjectPage (protected)
 *   /search          - SearchPage (protected)
 *   /settings        - SettingsPage (protected)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Auth pages (always accessible)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// App pages (protected)
import InboxPage from './pages/InboxPage';
import TodayPage from './pages/TodayPage';
import UpcomingPage from './pages/UpcomingPage';
import ProjectPage from './pages/ProjectPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/upcoming" element={<UpcomingPage />} />
            <Route path="/project/:id" element={<ProjectPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Redirect root to inbox */}
        <Route path="/" element={<Navigate to="/inbox" replace />} />

        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
