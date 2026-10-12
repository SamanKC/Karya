/**
 * Sidebar with navigation, favorites, projects tree, and labels.
 * Fetches live data via TanStack Query hooks.
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useProjects, useLabels, useCreateProject } from '../../hooks/api';
import { useAuth } from '../../contexts/auth-context';
import { COLOR_HEX, type ColorName } from '@karya/shared';
import type { ProjectResponse, LabelResponse } from '@karya/shared';

interface SidebarProps {
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: labels = [] } = useLabels();
  const createProject = useCreateProject();

  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);

  // Separate inbox from regular projects
  const inbox = projects.find((p) => p.isInbox);
  const regularProjects = projects.filter((p) => !p.isInbox);

  // Build favorites from projects and labels
  const favoriteProjects = regularProjects.filter((p) => p.isFavorite);
  const favoriteLabels = labels.filter((l) => l.isFavorite);
  const hasFavorites = favoriteProjects.length > 0 || favoriteLabels.length > 0;

  // Build project tree (top-level + children)
  const topLevelProjects = regularProjects.filter((p) => !p.parentId);
  const childProjects = (parentId: string) =>
    regularProjects.filter((p) => p.parentId === parentId);

  function isActive(path: string) {
    return location.pathname === path;
  }

  async function handleCreateProject() {
    const name = newProjectName.trim();
    if (!name) return;
    try {
      const project = await createProject.mutateAsync({ name });
      setNewProjectName('');
      setShowNewProject(false);
      navigate(`/project/${project.id}`);
      onClose();
    } catch {
      // Error handled by mutation
    }
  }

  function colorDot(color: string) {
    const hex = COLOR_HEX[color as ColorName] ?? '#808080';
    return (
      <span
        className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: hex }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
        <span className="flex-1 truncate text-sm font-medium text-sidebar-text">
          {user?.name ?? 'Karya'}
        </span>
        <button onClick={onClose} className="btn-icon md:hidden" aria-label="Close sidebar">
          <XIcon />
        </button>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        {/* Main nav */}
        <ul className="space-y-0.5">
          <NavItem
            to="/inbox"
            label="Inbox"
            icon={<InboxIcon active={isActive('/inbox')} />}
            active={isActive('/inbox')}
            onClick={onClose}
          />
          <NavItem
            to="/today"
            label="Today"
            icon={<TodayIcon active={isActive('/today')} />}
            active={isActive('/today')}
            onClick={onClose}
          />
          <NavItem
            to="/upcoming"
            label="Upcoming"
            icon={<UpcomingIcon active={isActive('/upcoming')} />}
            active={isActive('/upcoming')}
            onClick={onClose}
          />
          <NavItem
            to="/search"
            label="Search"
            icon={<SearchIcon active={isActive('/search')} />}
            active={isActive('/search')}
            onClick={onClose}
          />
        </ul>

        {/* Favorites */}
        {hasFavorites && (
          <section className="mt-5">
            <SectionHeader label="Favorites" />
            <ul className="mt-1 space-y-0.5">
              {favoriteProjects.map((p) => (
                <NavItem
                  key={p.id}
                  to={`/project/${p.id}`}
                  label={p.name}
                  icon={colorDot(p.color)}
                  active={isActive(`/project/${p.id}`)}
                  onClick={onClose}
                />
              ))}
              {favoriteLabels.map((l) => (
                <NavItem
                  key={l.id}
                  to={`/search?q=label:${encodeURIComponent(l.name)}`}
                  label={l.name}
                  icon={colorDot(l.color)}
                  active={false}
                  onClick={onClose}
                />
              ))}
            </ul>
          </section>
        )}

        {/* Projects */}
        <section className="mt-5">
          <div className="flex items-center justify-between px-3">
            <button
              onClick={() => setProjectsExpanded((v) => !v)}
              className="text-2xs font-medium uppercase tracking-wider text-sidebar-muted hover:text-sidebar-text transition-colors"
            >
              Projects
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="btn-icon p-0.5"
              title="Add project"
            >
              <PlusIcon />
            </button>
          </div>

          {projectsExpanded && (
            <ul className="mt-1 space-y-0.5">
              {topLevelProjects.map((p) => (
                <ProjectItem
                  key={p.id}
                  project={p}
                  children={childProjects(p.id)}
                  active={isActive(`/project/${p.id}`)}
                  location={location}
                  onClose={onClose}
                  colorDot={colorDot}
                />
              ))}

              {showNewProject && (
                <li className="px-3 py-1">
                  <input
                    autoFocus
                    className="input text-xs py-1"
                    placeholder="Project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateProject();
                      if (e.key === 'Escape') {
                        setShowNewProject(false);
                        setNewProjectName('');
                      }
                    }}
                    onBlur={() => {
                      if (!newProjectName.trim()) {
                        setShowNewProject(false);
                      }
                    }}
                  />
                </li>
              )}
            </ul>
          )}
        </section>

        {/* Labels */}
        <section className="mt-5">
          <button
            onClick={() => setLabelsExpanded((v) => !v)}
            className="px-3 text-2xs font-medium uppercase tracking-wider text-sidebar-muted hover:text-sidebar-text transition-colors"
          >
            Labels
          </button>
          {labelsExpanded && labels.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {labels.map((l) => (
                <NavItem
                  key={l.id}
                  to={`/search?q=${encodeURIComponent(l.name)}`}
                  label={l.name}
                  icon={colorDot(l.color)}
                  active={false}
                  onClick={onClose}
                />
              ))}
            </ul>
          )}
          {labelsExpanded && labels.length === 0 && (
            <p className="mt-1 px-3 text-xs text-sidebar-muted">No labels yet</p>
          )}
        </section>
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-border px-3 py-2 space-y-1">
        {/* Shortcuts hint */}
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[10px] text-sidebar-muted">Quick Add</span>
          <kbd className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">Q</kbd>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            onClick={onClose}
            className="btn-icon flex-1 justify-start gap-2 text-xs text-sidebar-muted"
          >
            <SettingsIcon />
            Settings
          </Link>
          <button onClick={logout} className="btn-icon text-xs text-sidebar-muted" title="Log out">
            <LogoutIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function NavItem({
  to,
  label,
  icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        className={`
          flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
          ${active
            ? 'bg-sidebar-active text-brand-500 font-medium'
            : 'text-sidebar-text hover:bg-sidebar-hover'
          }
        `}
      >
        {icon}
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

function ProjectItem({
  project,
  children,
  active,
  location,
  onClose,
  colorDot,
}: {
  project: ProjectResponse;
  children: ProjectResponse[];
  active: boolean;
  location: { pathname: string };
  onClose: () => void;
  colorDot: (color: string) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = children.length > 0;

  return (
    <>
      <li>
        <div className="flex items-center">
          {hasChildren && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="btn-icon p-0.5 ml-1"
            >
              <svg
                className={`h-3 w-3 text-sidebar-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <Link
            to={`/project/${project.id}`}
            onClick={onClose}
            className={`
              flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
              ${!hasChildren ? 'ml-5' : ''}
              ${active
                ? 'bg-sidebar-active text-brand-500 font-medium'
                : 'text-sidebar-text hover:bg-sidebar-hover'
              }
            `}
          >
            {colorDot(project.color)}
            <span className="truncate">{project.name}</span>
          </Link>
        </div>
      </li>
      {hasChildren && expanded && children.map((child) => (
        <li key={child.id}>
          <Link
            to={`/project/${child.id}`}
            onClick={onClose}
            className={`
              flex items-center gap-3 rounded-lg py-2 text-sm transition-colors
              pl-10 pr-3
              ${location.pathname === `/project/${child.id}`
                ? 'bg-sidebar-active text-brand-500 font-medium'
                : 'text-sidebar-text hover:bg-sidebar-hover'
              }
            `}
          >
            {colorDot(child.color)}
            <span className="truncate">{child.name}</span>
          </Link>
        </li>
      ))}
    </>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="px-3 text-2xs font-medium uppercase tracking-wider text-sidebar-muted">
      {label}
    </p>
  );
}

// ── Icons ───────────────────────────────────────────────────

function XIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function InboxIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-brand-500' : 'text-sidebar-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function TodayIcon({ active }: { active: boolean }) {
  const day = new Date().getDate().toString();
  return (
    <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-brand-500' : 'text-sidebar-muted'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <text x="12" y="19" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">{day}</text>
    </svg>
  );
}

function UpcomingIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-brand-500' : 'text-sidebar-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-brand-500' : 'text-sidebar-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4 text-sidebar-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
