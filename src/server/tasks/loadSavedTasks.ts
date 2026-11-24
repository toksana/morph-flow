import type { TaskView } from '@/core/widgets/taskList.view';
import type { TaskRow } from '@/server/db/tables/tasks';

import { createLogError } from '../logError';
import { toSavedTaskView } from './savedTaskView';

const logError = createLogError('tasks');

export interface LoadSavedTasksDeps {
  /** Clerk user id of the caller, or null for a guest. */
  identify: () => Promise<string | null>;
  /** The caller's `users.id`, or null if they have no row yet. */
  findUserId: (clerkUserId: string) => Promise<string | null>;
  listTasks: (userId: string) => Promise<TaskRow[]>;
}

/**
 * Builds the loader for the "Your tasks" card.
 * @returns the caller's live tasks in creation order, or null when there is nothing to show:
 * a guest, a user with no row yet, or a failed read (logged, so the start screen still renders)
 */
export const createLoadSavedTasks =
  ({ identify, findUserId, listTasks }: LoadSavedTasksDeps) =>
  async (): Promise<TaskView[] | null> => {
    try {
      const clerkUserId = await identify();
      if (clerkUserId === null) return null;
      const userId = await findUserId(clerkUserId);
      if (userId === null) return null;
      return (await listTasks(userId)).map(toSavedTaskView);
    } catch (error) {
      logError('loading saved tasks failed', error);
      return null;
    }
  };
