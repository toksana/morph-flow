import { connection } from 'next/server';
import type { JSX } from 'react';

import { SavedTaskList } from '@/components/savedTasks/SavedTaskList';
import { getDb } from '@/server/db/client';
import { listTasks } from '@/server/db/tasks';
import { createLoadSavedTasks } from '@/server/tasks/loadSavedTasks';

import { toggleTaskAction } from '../actions/tasks';
import { findCallerUserId, identifyCaller } from './deps';

const loadSavedTasks = createLoadSavedTasks({
  identify: identifyCaller,
  findUserId: findCallerUserId,
  listTasks: async (userId) => listTasks(getDb(), userId),
});

/**
 * "Your tasks" for a signed-in user, read at request time: render it inside <Suspense>. Guests,
 * users with no tasks and a failed read get nothing, so the start screen looks as before.
 */
export const SavedTasks = async (): Promise<JSX.Element | null> => {
  // Stops any prerender here, before the database: the session alone does not, since a
  // prefetch prerender can read it, and an uncached query there rejects as the prerender ends.
  await connection();
  const tasks = await loadSavedTasks();
  if (tasks === null || tasks.length === 0) return null;
  return <SavedTaskList tasks={tasks} toggleAction={toggleTaskAction} />;
};
