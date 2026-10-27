/**
 * Main app shell: sidebar + content area.
 *
 * - Sidebar collapses on mobile (< 768px) with hamburger toggle.
 * - Overlay on mobile when sidebar is open.
 * - Sidebar content is in Sidebar.tsx with live project/label data.
 */

import { useState, useCallback, useMemo, createContext, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { APP_NAME } from '@karya/shared';
import Sidebar from './Sidebar';
import QuickAddModal from '../tasks/QuickAddModal';
import { useKeyboardShortcuts, type ShortcutDef } from '../../hooks/useKeyboardShortcuts';

// ── Sidebar context (so children can close it on navigation) ──

interface SidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

// ── Layout component ────────────────────────────────────────

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = useCallback(() => setSidebarOpen((v) => !v), []);
  const close = useCallback(() => setSidebarOpen(false), []);

  const openQuickAdd = useCallback(() => setQuickAddOpen(true), []);
  const closeQuickAdd = useCallback(() => setQuickAddOpen(false), []);

  // Global keyboard shortcuts
  const shortcuts = useMemo<ShortcutDef[]>(() => [
    { key: 'q', handler: () => { openQuickAdd(); } },
    { key: '/', handler: () => { navigate('/search'); } },
    { key: 'g', handler: () => { navigate('/inbox'); } },
    { key: 'h', handler: () => { navigate('/today'); } },
  ], [openQuickAdd, navigate]);

  useKeyboardShortcuts(shortcuts);

  return (
    <SidebarContext.Provider value={{ isOpen: sidebarOpen, toggle, close }}>
      <div className="flex h-screen overflow-hidden bg-paper">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/30 md:hidden"
            onClick={close}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-[280px] flex-shrink-0
            transform bg-sidebar-bg border-r border-surface-border
            transition-transform duration-200
            md:static md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar onClose={close} />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile header with hamburger */}
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-surface-border bg-surface-primary px-4 py-3 md:hidden">
            <button onClick={toggle} className="btn-icon" aria-label="Open sidebar">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="wordmark text-base">{APP_NAME}</span>
          </div>

          <div className="mx-auto max-w-content px-4 py-6 md:px-8">
            <Outlet />
          </div>
        </main>

        {/* Quick Add modal (Q shortcut) */}
        <QuickAddModal isOpen={quickAddOpen} onClose={closeQuickAdd} />
      </div>
    </SidebarContext.Provider>
  );
}
