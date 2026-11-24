'use server';

import { refresh } from 'next/cache';

import type { ToggleTaskResult } from '@/core/tasks/taskToggle';
import { getDb } from '@/server/db/client';
import { setTaskCompleted } from '@/server/db/tasks';
import { createToggleTask } from '@/server/tasks/toggleTask';

import { findCallerUserId, identifyCaller } from '../_tasks/deps';

const toggleTask = createToggleTask({
  identify: identifyCaller,
  findUserId: findCallerUserId,
  setTaskCompleted: async (userId, taskId, done) => setTaskCompleted(getDb(), userId, taskId, done),
});

/**
 * Ticks a saved task off or opens it again. On success the page's Server Components render again
 * in the same round trip, so the list the optimistic tick falls back to is the saved state.
 */
export const toggleTaskAction = async (input: unknown): Promise<ToggleTaskResult> => {
  const result = await toggleTask(input);
  if (result.ok) refresh();
  return result;
};
