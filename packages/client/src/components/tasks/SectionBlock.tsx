/**
 * A section header with its tasks, collapse toggle, and inline rename.
 */

import { useState } from 'react';
import type { SectionResponse, TaskResponse } from '@karya/shared';
import { useUpdateSection, useDeleteSection } from '../../hooks/api';
import TaskRow from './TaskRow';
import TaskAddInline from './TaskAddInline';

interface SectionBlockProps {
  section: SectionResponse;
  tasks: TaskResponse[];
  onSelectTask: (task: TaskResponse) => void;
}

export default function SectionBlock({ section, tasks, onSelectTask }: SectionBlockProps) {
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  const [collapsed, setCollapsed] = useState(section.isCollapsed);
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(section.name);

  function handleToggle() {
    const next = !collapsed;
    setCollapsed(next);
    updateSection.mutate({ id: section.id, projectId: section.projectId, isCollapsed: next });
  }

  function handleRename() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== section.name) {
      updateSection.mutate({ id: section.id, projectId: section.projectId, name: trimmed });
    } else {
      setName(section.name);
    }
    setIsRenaming(false);
  }

  function handleDeleteSection() {
    if (tasks.length > 0) return; // Don't delete sections with tasks
    deleteSection.mutate({ id: section.id, projectId: section.projectId });
  }

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex items-center gap-2 px-3 py-1 group">
        <button onClick={handleToggle} className="flex-shrink-0">
          <svg
            className={`h-3.5 w-3.5 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-90'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {isRenaming ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setName(section.name); setIsRenaming(false); }
            }}
            className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none border-b border-brand-500"
          />
        ) : (
          <button
            onDoubleClick={() => setIsRenaming(true)}
            className="flex-1 text-left text-sm font-semibold text-gray-700"
          >
            {section.name}
          </button>
        )}

        <span className="text-2xs text-gray-400 mr-1">{tasks.length}</span>

        {tasks.length === 0 && (
          <button
            onClick={handleDeleteSection}
            className="opacity-0 group-hover:opacity-100 transition-opacity btn-icon p-0.5"
            title="Delete empty section"
          >
            <svg className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Tasks */}
      {!collapsed && (
        <div>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onSelect={onSelectTask} />
          ))}
          <TaskAddInline projectId={section.projectId} sectionId={section.id} />
        </div>
      )}
    </div>
  );
}
