import { connection } from 'next/server';
import type { JSX } from 'react';

import { SavedHabitList } from '@/components/savedHabits/SavedHabitList';
import { StartCards } from '@/components/savedCards/StartCards';
import { SavedTaskList } from '@/components/savedTasks/SavedTaskList';
import { getDb } from '@/server/db/client';
import { listHabits } from '@/server/db/habits';
import { listTasks } from '@/server/db/tasks';
import { createLoadSavedHabits } from '@/server/habits/loadSavedHabits';
import { createLoadSavedTasks } from '@/server/tasks/loadSavedTasks';

import { checkInHabitAction } from '../actions/habits';
import { toggleTaskAction } from '../actions/tasks';
import { findCaller, findCallerUserId, identifyCaller } from './deps';

const loadSavedTasks = createLoadSavedTasks({
  identify: identifyCaller,
  findUserId: findCallerUserId,
  listTasks: async (userId) => listTasks(getDb(), userId),
});

const loadSavedHabits = createLoadSavedHabits({
  identify: identifyCaller,
  findUser: findCaller,
  listHabits: async (userId) => listHabits(getDb(), userId),
});

const hasAny = <T,>(items: T[] | null): items is T[] => items !== null && items.length > 0;

/**
 * A signed-in user's start screen under the field, read at request time: render it inside
 * <Suspense> within a WidgetGenerator. "Your tasks" and "Habits", each only when it has something
 * to show (a failed read counts as nothing); with neither, the examples as a first step.
 */
export const SavedCards = async (): Promise<JSX.Element | null> => {
  // Stops any prerender here, before the database: the session alone does not, since a
  // prefetch prerender can read it, and an uncached query there rejects as the prerender ends.
  await connection();
  const [tasks, habits] = await Promise.all([loadSavedTasks(), loadSavedHabits()]);
  const cards = [
    hasAny(tasks) && <SavedTaskList key="tasks" tasks={tasks} toggleAction={toggleTaskAction} />,
    hasAny(habits) && (
      <SavedHabitList key="habits" habits={habits} checkInAction={checkInHabitAction} />
    ),
  ].filter((card) => card !== false);
  return <StartCards cards={cards} />;
};
