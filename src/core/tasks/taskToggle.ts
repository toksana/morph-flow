import { z } from 'zod';

import type { SaveResult } from '../saveResult';
import type { TaskView } from '../widgets/taskList.view';

/** What the client sends to tick a saved task off or open it again. */
export const toggleTaskRequestSchema = z.object({
  taskId: z.uuid(),
  done: z.boolean(),
});

export type ToggleTaskRequest = z.infer<typeof toggleTaskRequestSchema>;

export type ToggleTaskResult = SaveResult;

/**
 * The list with one task's `done` set, everything else as it was: the optimistic update, so the
 * checkbox moves before the server answers. An id that is not in the list changes nothing.
 */
export const applyTaskToggle = (
  tasks: readonly TaskView[],
  { taskId, done }: ToggleTaskRequest,
): TaskView[] => tasks.map((task) => (task.id === taskId ? { ...task, done } : task));
