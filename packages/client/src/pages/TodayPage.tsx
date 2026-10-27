/**
 * Today view: overdue tasks + tasks due today.
 */

import { useState } from 'react';
import type { TaskResponse } from '@karya/shared';
import { useTodayTasks } from '../hooks/api';
import TaskRow from '../components/tasks/TaskRow';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel';

export default function TodayPage() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data: tasks = [], isLoading } = useTodayTasks(timezone);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < todayStr && !t.isCompleted);
  const todayTasks = tasks.filter((t) => !overdue.includes(t));

  return (
    <div>
      <h1 className="page-title">Today</h1>
      <p className="mt-1 text-sm text-sidebar-muted">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {isLoading && (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-sidebar-hover" />
          ))}
        </div>
      )}

      {!isLoading && tasks.length === 0 && (
        <div className="mt-16 text-center">
          <p className="font-display text-2xl text-brand-500">All caught up</p>
          <p className="mt-1 text-sm text-sidebar-muted">Nothing due today — enjoy the quiet.</p>
        </div>
      )}

      {!isLoading && overdue.length > 0 && (
        <div className="mt-6">
          <h2 className="section-label px-3 text-danger">
            Overdue ({overdue.length})
          </h2>
          <div className="mt-1">
            {overdue.map((task) => (
              <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && todayTasks.length > 0 && (
        <div className="mt-6">
          {overdue.length > 0 && (
            <h2 className="section-label px-3">
              Today ({todayTasks.length})
            </h2>
          )}
          <div className="mt-1">
            {todayTasks.map((task) => (
              <TaskRow key={task.id} task={task} onSelect={setSelectedTask} />
            ))}
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
