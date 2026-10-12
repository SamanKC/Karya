/**
 * Inbox view: shows open tasks in the user's Inbox project.
 */

import { useState } from 'react';
import { useProjects, useTasks } from '../hooks/api';
import type { TaskResponse } from '@karya/shared';
import TaskRow from '../components/tasks/TaskRow';
import TaskAddInline from '../components/tasks/TaskAddInline';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';

export default function InboxPage() {
  const { data: projects = [] } = useProjects();
  const inbox = projects.find((p) => p.isInbox);

  const { data: tasks = [], isLoading } = useTasks(
    inbox ? { projectId: inbox.id, completed: false } : undefined,
    { enabled: !!inbox },
  );

  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  // Filter out subtasks (show only top-level)
  const topLevelTasks = tasks.filter((t) => !t.parentId);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Inbox</h1>

      {isLoading && (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && topLevelTasks.length === 0 && inbox && (
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">Your inbox is empty.</p>
          <p className="mt-1 text-xs text-gray-400">Tasks without a project land here.</p>
        </div>
      )}

      {!isLoading && topLevelTasks.length > 0 && (
        <div className="mt-4">
          {topLevelTasks.map((task) => (
            <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
          ))}
        </div>
      )}

      {inbox && (
        <div className="mt-2">
          <TaskAddInline projectId={inbox.id} />
        </div>
      )}

      {selectedTask && (
        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
