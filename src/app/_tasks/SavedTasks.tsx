import { connection } from 'next/server';
import type { JSX } from 'react';

import { GeneratorPresets } from '@/components/generator/GeneratorPresets';
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
 * A signed-in user's start screen under the field, read at request time: render it inside
 * <Suspense> within a WidgetGenerator. "Your tasks" once there are any; until then (or if the read
 * fails) the examples, as a first step.
 */
export const SavedTasks = async (): Promise<JSX.Element> => {
  // Stops any prerender here, before the database: the session alone does not, since a
  // prefetch prerender can read it, and an uncached query there rejects as the prerender ends.
  await connection();
  const tasks = await loadSavedTasks();
  if (tasks === null || tasks.length === 0) return <GeneratorPresets />;
  return <SavedTaskList tasks={tasks} toggleAction={toggleTaskAction} />;
};
