/**
 * Search view: debounced search across tasks and projects.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TaskResponse } from '@karya/shared';
import { COLOR_HEX, type ColorName } from '@karya/shared';
import { useSearch } from '../hooks/api';
import TaskRow from '../components/tasks/TaskRow';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  const { data, isLoading } = useSearch(debouncedQuery);
  const tasks = data?.tasks ?? [];
  const projects = data?.projects ?? [];
  const hasResults = tasks.length > 0 || projects.length > 0;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Search</h1>

      <div className="mt-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and projects..."
            className="input pl-10"
            autoFocus
          />
        </div>
      </div>

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && debouncedQuery.length >= 2 && !hasResults && (
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">No results for "{debouncedQuery}"</p>
        </div>
      )}

      {!isLoading && hasResults && (
        <div className="mt-6">
          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Projects ({projects.length})
              </h2>
              <ul className="mt-1 space-y-0.5">
                {projects.map((p) => {
                  const hex = COLOR_HEX[p.color as ColorName] ?? '#808080';
                  return (
                    <li key={p.id}>
                      <a
                        href={`/project/${p.id}`}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        {p.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <div className={projects.length > 0 ? 'mt-6' : ''}>
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tasks ({tasks.length})
              </h2>
              <div className="mt-1">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedTask && (
        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
