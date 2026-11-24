import { type ToggleTaskRequest, applyTaskToggle } from '@/core/tasks/taskToggle';
import type { TaskView } from '@/core/widgets/taskList.view';

import { type SaveAction, useOptimisticToggle } from './useOptimisticToggle';

export type ToggleTaskAction = SaveAction<ToggleTaskRequest>;

export interface OptimisticTaskToggle {
  /** The saved tasks with every tick still in flight already applied. */
  tasks: TaskView[];
  toggle: (taskId: string, done: boolean) => void;
  /** True after a tick that was not saved; cleared by the next tick. */
  hasError: boolean;
}

/** Ticks a saved task at once and saves it in the background; a failed tick rolls back. */
export const useOptimisticTaskToggle = (
  tasks: TaskView[],
  action: ToggleTaskAction,
): OptimisticTaskToggle => {
  const { items, toggle, hasError } = useOptimisticToggle(tasks, {
    apply: applyTaskToggle,
    action,
    scope: 'tasks',
  });
  return { tasks: items, toggle: (taskId, done) => toggle({ taskId, done }), hasError };
};
