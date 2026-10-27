/**
 * Project view: shows sections and tasks within a project.
 * Supports section creation, inline task add, task detail panel.
 */

import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import type { TaskResponse } from '@karya/shared';
import { useProject, useTasks, useSections, useCreateSection } from '../hooks/api';
import TaskRow from '../components/tasks/TaskRow';
import TaskAddInline from '../components/tasks/TaskAddInline';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';
import SectionBlock from '../components/tasks/SectionBlock';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id!);
  const { data: tasks = [] } = useTasks(
    id ? { projectId: id, completed: false } : undefined,
    { enabled: !!id },
  );
  const { data: sections = [] } = useSections(id!);
  const createSection = useCreateSection();

  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  if (projectLoading) {
    return (
      <div className="space-y-3 mt-8">
        <div className="h-8 w-48 animate-pulse rounded bg-sidebar-hover" />
        <div className="h-10 animate-pulse rounded-lg bg-sidebar-hover" />
        <div className="h-10 animate-pulse rounded-lg bg-sidebar-hover" />
      </div>
    );
  }

  if (projectError || !project) {
    return <Navigate to="/inbox" replace />;
  }

  // Tasks without a section (top-level, no subtasks)
  const unsectionedTasks = tasks.filter((t) => !t.sectionId && !t.parentId);

  // Group tasks by section
  const tasksBySection = (sectionId: string) =>
    tasks.filter((t) => t.sectionId === sectionId && !t.parentId);

  async function handleCreateSection() {
    const name = newSectionName.trim();
    if (!name || !id) return;
    try {
      await createSection.mutateAsync({ projectId: id, name });
      setNewSectionName('');
      setShowNewSection(false);
    } catch {
      // handled
    }
  }

  return (
    <div>
      {/* Project header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">
          {project.isInbox ? 'Inbox' : project.name}
        </h1>
      </div>

      {/* Unsectioned tasks */}
      {unsectionedTasks.length > 0 && (
        <div className="mt-4">
          {unsectionedTasks.map((task) => (
            <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
          ))}
        </div>
      )}

      {/* Add task (no section) */}
      <div className="mt-2">
        <TaskAddInline projectId={id!} />
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          tasks={tasksBySection(section.id)}
          onSelectTask={setSelectedTask}
        />
      ))}

      {/* Add section */}
      <div className="mt-6">
        {showNewSection ? (
          <div className="px-3">
            <input
              autoFocus
              className="input text-sm"
              placeholder="Section name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSection();
                if (e.key === 'Escape') { setShowNewSection(false); setNewSectionName(''); }
              }}
              onBlur={() => { if (!newSectionName.trim()) setShowNewSection(false); }}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowNewSection(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-muted hover:text-brand-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add section
          </button>
        )}
      </div>

      {/* Task detail panel */}
      {selectedTask && (
        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
