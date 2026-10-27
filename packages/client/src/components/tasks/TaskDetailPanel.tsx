/**
 * Slide-over panel for viewing/editing a single task's full details.
 * Fields: content, description, project, priority, due date, labels.
 */

import { useState, useEffect } from 'react';
import { PRIORITY_VALUES, PRIORITY_LABELS, PRIORITY_COLORS, COLOR_HEX, type ColorName } from '@karya/shared';
import type { TaskResponse } from '@karya/shared';
import { useUpdateTask, useProjects, useLabels } from '../../hooks/api';

interface TaskDetailPanelProps {
  task: TaskResponse;
  onClose: () => void;
}

export default function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const updateTask = useUpdateTask();
  const { data: projects = [] } = useProjects();
  const { data: labels = [] } = useLabels();

  const [content, setContent] = useState(task.content);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [projectId, setProjectId] = useState(task.projectId);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    task.labels.map((l) => l.id)
  );

  // Reset when task changes
  useEffect(() => {
    setContent(task.content);
    setDescription(task.description ?? '');
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');
    setProjectId(task.projectId);
    setSelectedLabelIds(task.labels.map((l) => l.id));
  }, [task.id]);

  function handleSave() {
    updateTask.mutate({
      id: task.id,
      content: content.trim() || task.content,
      description: description.trim() || null,
      priority,
      dueDate: dueDate || null,
      projectId,
      labelIds: selectedLabelIds,
    });
    onClose();
  }

  function toggleLabel(labelId: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-surface-primary shadow-xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
          <h2 className="text-base font-semibold text-ink">Task details</h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">Task name</label>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Add more detail..."
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.isInbox ? 'Inbox' : p.name}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">Priority</label>
            <div className="flex gap-2">
              {([...PRIORITY_VALUES] as number[]).reverse().map((val) => (
                <button
                  key={val}
                  onClick={() => setPriority(val as 1 | 2 | 3 | 4)}
                  className={`
                    rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors
                    ${priority === val
                      ? 'border-current'
                      : 'border-surface-border hover:border-sidebar-muted'
                    }
                  `}
                  style={{
                    color: val === 1 ? '#6b7280' : PRIORITY_COLORS[val],
                  }}
                >
                  {PRIORITY_LABELS[val]}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">Due date</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input flex-1"
              />
              {dueDate && (
                <button
                  onClick={() => setDueDate('')}
                  className="btn btn-ghost btn-sm text-sidebar-muted"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">Labels</label>
            {labels.length === 0 ? (
              <p className="text-xs text-sidebar-muted">No labels created yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => {
                  const hex = COLOR_HEX[label.color as ColorName] ?? '#808080';
                  const selected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      className={`
                        inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors
                        ${selected ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}
                      `}
                      style={{
                        backgroundColor: hex + '20',
                        color: hex,
                        ...(selected ? { ringColor: hex } : {}),
                      }}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                      {label.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-surface-border px-6 py-4 flex gap-3">
          <button onClick={handleSave} className="btn btn-primary flex-1" disabled={updateTask.isPending}>
            Save changes
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
