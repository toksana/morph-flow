import { type ToggleTaskResult, toggleTaskRequestSchema } from '@/core/tasks/taskToggle';

import { createLogError } from '../logError';

const logError = createLogError('tasks');

export interface ToggleTaskDeps {
  /** Clerk user id of the caller, or null for a guest. */
  identify: () => Promise<string | null>;
  /** The caller's `users.id`, or null if they have no row yet. */
  findUserId: (clerkUserId: string) => Promise<string | null>;
  /** @returns false if the caller has no such live task */
  setTaskCompleted: (userId: string, taskId: string, done: boolean) => Promise<boolean>;
}

/**
 * Builds the toggle behind the Server Action. The action is a public POST endpoint, so the input
 * is validated and the caller checked on every call; the task must be theirs. Database failures
 * come back as a result, and the client rolls its optimistic tick back.
 */
export const createToggleTask =
  ({ identify, findUserId, setTaskCompleted }: ToggleTaskDeps) =>
  async (input: unknown): Promise<ToggleTaskResult> => {
    const parsed = toggleTaskRequestSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: 'invalid' };
    const { taskId, done } = parsed.data;
    // Outside the try, like every framework call: Next.js signals through rejections there.
    const clerkUserId = await identify();
    if (clerkUserId === null) return { ok: false, error: 'unauthorized' };
    try {
      const userId = await findUserId(clerkUserId);
      const updated = userId !== null && (await setTaskCompleted(userId, taskId, done));
      return updated ? { ok: true } : { ok: false, error: 'not_found' };
    } catch (error) {
      logError('toggling a task failed', error);
      return { ok: false, error: 'failed' };
    }
  };
