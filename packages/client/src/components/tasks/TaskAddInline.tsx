/**
 * Inline task creation row.
 * Shows a text input that creates a task on Enter.
 */

import { useState, useRef, useEffect } from 'react';
import { useCreateTask } from '../../hooks/api';

interface TaskAddInlineProps {
  projectId?: string;
  sectionId?: string | null;
  parentId?: string | null;
  autoFocus?: boolean;
  placeholder?: string;
}

export default function TaskAddInline({
  projectId,
  sectionId = null,
  parentId = null,
  autoFocus = false,
  placeholder = 'Add a task...',
}: TaskAddInlineProps) {
  const [isEditing, setIsEditing] = useState(autoFocus);
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      await createTask.mutateAsync({
        content: trimmed,
        projectId,
        sectionId,
        parentId,
      });
      setContent('');
      // Keep input open for rapid entry
    } catch {
      // Error handled by mutation
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-brand-500 hover:bg-gray-50 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {placeholder}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2">
      <input
        ref={inputRef}
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === 'Escape') {
            setIsEditing(false);
            setContent('');
          }
        }}
        placeholder="Task name"
        className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        disabled={createTask.isPending}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || createTask.isPending}
          className="btn btn-primary btn-sm"
        >
          Add task
        </button>
        <button
          onClick={() => { setIsEditing(false); setContent(''); }}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
