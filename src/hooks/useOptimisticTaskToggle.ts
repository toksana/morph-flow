import { startTransition, useOptimistic, useState } from 'react';

import {
  type ToggleTaskRequest,
  type ToggleTaskResult,
  applyTaskToggle,
} from '@/core/tasks/taskToggle';
import type { TaskView } from '@/core/widgets/taskList.view';

export type ToggleTaskAction = (request: ToggleTaskRequest) => Promise<ToggleTaskResult>;

export interface OptimisticTaskToggle {
  /** The saved tasks with every tick still in flight already applied. */
  tasks: TaskView[];
  toggle: (taskId: string, done: boolean) => void;
  /** True after a tick that was not saved; cleared by the next tick. */
  hasError: boolean;
}

/**
 * Ticks a task at once and saves it in the background. When the action settles, the optimistic
 * state gives way to `tasks`: the saved state on success (the action refreshes the page's Server
 * Components), or the state before the tick on failure, so a failed tick rolls itself back.
 */
export const useOptimisticTaskToggle = (
  tasks: TaskView[],
  toggleAction: ToggleTaskAction,
): OptimisticTaskToggle => {
  const [optimisticTasks, applyOptimistic] = useOptimistic(tasks, applyTaskToggle);
  const [hasError, setHasError] = useState(false);

  const save = async (request: ToggleTaskRequest): Promise<boolean> => {
    try {
      return (await toggleAction(request)).ok;
    } catch (error) {
      // A network failure rejects instead of returning a result; it counts as not saved.
      if (error instanceof Error) console.error('[tasks] toggle request failed:', error.message);
      return false;
    }
  };

  const toggle = (taskId: string, done: boolean): void => {
    setHasError(false);
    startTransition(async () => {
      applyOptimistic({ taskId, done });
      if (!(await save({ taskId, done }))) setHasError(true);
    });
  };

  return { tasks: optimisticTasks, toggle, hasError };
};
