/**
 * Single task row: checkbox, content, due date chip, priority flag, label pills.
 * Clicking the content opens the task detail panel.
 */

import { useRef } from 'react';
import { PRIORITY_COLORS, PRIORITY_LABELS, COLOR_HEX, type ColorName } from '@karya/shared';
import type { TaskResponse } from '@karya/shared';
import { useCloseTask, useReopenTask, useDeleteTask } from '../../hooks/api';
import { useToast } from '../ui/Toast';

interface TaskRowProps {
  task: TaskResponse;
  onSelect: (task: TaskResponse) => void;
  depth?: number;
}

export default function TaskRow({ task, onSelect, depth = 0 }: TaskRowProps) {
  const closeTask = useCloseTask();
  const reopenTask = useReopenTask();
  const deleteTask = useDeleteTask();
  const { addToast } = useToast();
  const deleteTimer = useRef<ReturnType<typeof setTimeout>>();

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (task.isCompleted) {
      reopenTask.mutate(task.id);
    } else {
      closeTask.mutate(task.id);
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    // ADR-005: client-side undo toast before hard delete
    const timer = setTimeout(() => {
      deleteTask.mutate(task.id);
    }, 5000);
    deleteTimer.current = timer;

    addToast({
      message: 'Task deleted',
      type: 'info',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          clearTimeout(timer);
        },
      },
    });
  }

  const priorityColor = PRIORITY_COLORS[task.priority] ?? 'transparent';
  const isUrgent = task.priority >= 3;
  const dueDateStr = formatDueDate(task.dueDate);
  const isDueOverdue = task.dueDate ? isOverdue(task.dueDate) : false;
  const isDueToday = task.dueDate ? isToday(task.dueDate) : false;

  return (
    <div
      className="group flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
      style={{ paddingLeft: `${12 + depth * 24}px` }}
      onClick={() => onSelect(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(task); }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className="mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{
          borderColor: priorityColor === 'transparent' ? '#d1d5db' : priorityColor,
          backgroundColor: task.isCompleted ? (priorityColor === 'transparent' ? '#d1d5db' : priorityColor) : 'transparent',
        }}
        aria-label={task.isCompleted ? 'Reopen task' : 'Complete task'}
      >
        {task.isCompleted && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-5 ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.content}
        </p>

        {/* Meta line: due date, labels */}
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {dueDateStr && (
            <span
              className={`text-xs ${
                isDueOverdue ? 'text-red-600' :
                isDueToday ? 'text-brand-500' :
                'text-gray-500'
              }`}
            >
              {dueDateStr}
            </span>
          )}

          {task.labels.map((label) => {
            const hex = COLOR_HEX[label.color as ColorName] ?? '#808080';
            return (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-2xs"
                style={{ backgroundColor: hex + '20', color: hex }}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
                {label.name}
              </span>
            );
          })}

          {isUrgent && (
            <span className="text-2xs font-medium" style={{ color: priorityColor }}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
        </div>
      </div>

      {/* Delete button (on hover) */}
      <button
        onClick={handleDelete}
        className="mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity btn-icon p-1"
        aria-label="Delete task"
        title="Delete task"
      >
        <svg className="h-4 w-4 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < -1) return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return due.toLocaleDateString(undefined, { weekday: 'long' });
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate + 'T00:00:00') < today;
}

function isToday(dueDate: string): boolean {
  const today = new Date();
  const d = dueDate.split('-');
  return (
    today.getFullYear() === Number(d[0]) &&
    today.getMonth() + 1 === Number(d[1]) &&
    today.getDate() === Number(d[2])
  );
}
