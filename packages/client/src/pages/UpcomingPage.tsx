/**
 * Upcoming view: 14-day date-grouped tasks with overdue section.
 */

import { useState } from 'react';
import type { TaskResponse } from '@karya/shared';
import { useUpcomingTasks } from '../hooks/api';
import TaskRow from '../components/tasks/TaskRow';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';

export default function UpcomingPage() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data, isLoading } = useUpcomingTasks(timezone, 14);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  const overdue = data?.overdue ?? [];
  const dateGroups = data?.dates ?? [];

  function formatDateHeader(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  return (
    <div>
      <h1 className="page-title">Upcoming</h1>

      {isLoading && (
        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-sidebar-hover" />
          ))}
        </div>
      )}

      {!isLoading && overdue.length === 0 && dateGroups.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-sm text-sidebar-muted">No upcoming tasks in the next 14 days.</p>
        </div>
      )}

      {!isLoading && overdue.length > 0 && (
        <div className="mt-4">
          <h2 className="section-label px-3 py-2 text-danger">
            Overdue ({overdue.length})
          </h2>
          {overdue.map((task) => (
            <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
          ))}
        </div>
      )}

      {!isLoading && dateGroups.map((group) => (
        <div key={group.date} className="mt-4">
          <h2 className="section-label px-3 py-2 border-b border-surface-border">
            {formatDateHeader(group.date)}
          </h2>
          {group.tasks.map((task) => (
            <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
          ))}
        </div>
      ))}

      {selectedTask && (
        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
