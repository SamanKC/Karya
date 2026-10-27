/**
 * Quick Add modal for rapid task creation.
 *
 * Triggered by the 'Q' keyboard shortcut from anywhere in the app.
 * Provides: content input, project selector, priority selector,
 * due date picker, and label multi-select.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useCreateTask, useProjects, useLabels } from '../../hooks/api';
import { useToast } from '../ui/Toast';
import {
  PRIORITY_VALUES,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  COLOR_HEX,
  type Priority,
  type ColorName,
} from '@karya/shared';
import type { ProjectResponse } from '@karya/shared';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fill with a specific project (e.g. from the current view). */
  defaultProjectId?: string;
}

export default function QuickAddModal({
  isOpen,
  onClose,
  defaultProjectId,
}: QuickAddModalProps) {
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [priority, setPriority] = useState<Priority>(1);
  const [dueDate, setDueDate] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [showDescription, setShowDescription] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();
  const { addToast } = useToast();
  const { data: projects = [] } = useProjects();
  const { data: labels = [] } = useLabels();

  // Find inbox as fallback project
  const inbox = useMemo(
    () => projects.find((p: ProjectResponse) => p.isInbox),
    [projects],
  );

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent('');
      setDescription('');
      setProjectId(defaultProjectId ?? inbox?.id ?? '');
      setPriority(1);
      setDueDate('');
      setSelectedLabelIds([]);
      setShowDescription(false);
      setShowLabels(false);
      // Focus the input after a tick (for animation)
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultProjectId, inbox?.id]);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      await createTask.mutateAsync({
        content: trimmed,
        description: description.trim() || undefined,
        projectId: projectId || inbox?.id,
        priority,
        dueDate: dueDate || undefined,
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      });
      addToast({ type: 'success', message: 'Task added' });
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to add task' });
    }
  }

  function toggleLabel(labelId: string) {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    );
  }

  if (!isOpen) return null;

  const regularProjects = projects.filter((p: ProjectResponse) => !p.isInbox);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-xl bg-surface-primary shadow-2xl animate-fade-in"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        {/* Content input */}
        <div className="px-5 pt-5">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && content.trim()) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Task name"
            className="w-full text-base font-medium text-ink placeholder-gray-400 outline-none"
            autoComplete="off"
          />

          {/* Description (toggle) */}
          {showDescription ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={2}
              className="mt-2 w-full resize-none text-sm text-sidebar-muted placeholder-gray-400 outline-none"
            />
          ) : (
            <button
              onClick={() => setShowDescription(true)}
              className="mt-1 text-xs text-sidebar-muted hover:text-sidebar-muted transition-colors"
            >
              + Add description
            </button>
          )}
        </div>

        {/* Toolbar row */}
        <div className="mt-3 flex flex-wrap items-center gap-2 px-5">
          {/* Due date */}
          <div className="relative">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`
                h-8 rounded-md border px-2.5 text-xs outline-none transition-colors
                ${dueDate
                  ? 'border-brand-200 bg-brand-50 text-brand-700'
                  : 'border-surface-border text-sidebar-muted hover:border-sidebar-muted'
                }
              `}
            />
          </div>

          {/* Priority */}
          <div className="flex items-center rounded-md border border-surface-border">
            {([...PRIORITY_VALUES] as number[]).reverse().map((p) => {
              const isSelected = priority === p;
              const hex = p === 1 ? '#6b7280' : PRIORITY_COLORS[p];
              return (
                <button
                  key={p}
                  onClick={() => setPriority(p as Priority)}
                  title={PRIORITY_LABELS[p]}
                  className={`
                    h-8 px-2 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md
                    ${isSelected ? 'ring-1 ring-inset' : 'hover:bg-sidebar-hover'}
                  `}
                  style={{
                    color: hex,
                    ...(isSelected ? { backgroundColor: `${hex}15`, ringColor: hex } : {}),
                  }}
                >
                  P{5 - p}
                </button>
              );
            })}
          </div>

          {/* Project selector */}
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-8 rounded-md border border-surface-border px-2 text-xs text-sidebar-muted outline-none hover:border-sidebar-muted"
          >
            {inbox && <option value={inbox.id}>Inbox</option>}
            {regularProjects.map((p: ProjectResponse) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Labels toggle */}
          <button
            onClick={() => setShowLabels((v) => !v)}
            className={`
              flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs transition-colors
              ${selectedLabelIds.length > 0
                ? 'border-brand-200 bg-brand-50 text-brand-700'
                : 'border-surface-border text-sidebar-muted hover:border-sidebar-muted'
              }
            `}
          >
            <TagIcon />
            {selectedLabelIds.length > 0 ? `${selectedLabelIds.length} label${selectedLabelIds.length > 1 ? 's' : ''}` : 'Labels'}
          </button>
        </div>

        {/* Labels panel (expandable) */}
        {showLabels && labels.length > 0 && (
          <div className="mx-5 mt-2 flex flex-wrap gap-1.5 rounded-lg border border-surface-border bg-sidebar-hover p-3">
            {labels.map((label) => {
              const hex = COLOR_HEX[label.color as ColorName] ?? '#808080';
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className={`
                    flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors
                    ${isSelected
                      ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                      : 'bg-surface-primary text-sidebar-muted hover:bg-sidebar-hover'
                    }
                  `}
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

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between rounded-b-xl border-t border-surface-border bg-sidebar-hover px-5 py-3">
          <span className="text-xs text-sidebar-muted">
            Press <kbd className="rounded bg-sidebar-active px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> to add
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || createTask.isPending}
              className="btn btn-primary btn-sm"
            >
              {createTask.isPending ? 'Adding...' : 'Add task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────

function TagIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}
