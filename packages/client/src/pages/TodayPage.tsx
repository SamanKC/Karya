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
      <h1 className="text-xl font-bold text-gray-900">Today</h1>
      <p className="mt-1 text-xs text-gray-400">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {isLoading && (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && tasks.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-3xl">&#127881;</p>
          <p className="mt-2 text-sm text-gray-500">All caught up for today!</p>
        </div>
      )}

      {!isLoading && overdue.length > 0 && (
        <div className="mt-4">
          <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-red-500">
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
        <div className="mt-4">
          {overdue.length > 0 && (
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
