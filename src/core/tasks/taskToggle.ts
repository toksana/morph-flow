import { z } from 'zod';

import type { TaskView } from '../widgets/taskList.view';

/** What the client sends to tick a saved task off or open it again. */
export const toggleTaskRequestSchema = z.object({
  taskId: z.uuid(),
  done: z.boolean(),
});

export type ToggleTaskRequest = z.infer<typeof toggleTaskRequestSchema>;

/** Why a toggle was not saved; the client only shows a generic message for any of them. */
export type ToggleTaskError = 'invalid' | 'unauthorized' | 'not_found' | 'failed';

export type ToggleTaskResult = { ok: true } | { ok: false; error: ToggleTaskError };

/**
 * The list with one task's `done` set, everything else as it was: the optimistic update, so the
 * checkbox moves before the server answers. An id that is not in the list changes nothing.
 */
export const applyTaskToggle = (
  tasks: readonly TaskView[],
  { taskId, done }: ToggleTaskRequest,
): TaskView[] => tasks.map((task) => (task.id === taskId ? { ...task, done } : task));
