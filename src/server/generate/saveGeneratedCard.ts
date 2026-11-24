import { localDay } from '@/core/widgets/promptDate';
import type { Widget } from '@/core/widgets/widget.schema';
import { type GeneratedHabit, generatedHabit } from '@/server/db/habitValues';
import { type TaskValues, generatedTaskValues } from '@/server/db/taskValues';

import { createLogError } from '../logError';

const logError = createLogError('generate');

export interface CardStores {
  /** Stores a signed-in user's generated tasks, in order; the database hands out their ids. */
  saveTasks?: (userId: string, tasks: readonly TaskValues[]) => Promise<void>;
  /** Stores a signed-in user's generated habit, with today's check-in if it is already done. */
  saveHabit?: (userId: string, habit: GeneratedHabit) => Promise<void>;
}

export interface GeneratedCard {
  userId: string;
  widget: Widget;
  now: Date;
  /** The request's zone, which is also the user's saved one: it defines a habit's first day. */
  timeZone: string;
}

const saveWidget = async (
  { saveTasks, saveHabit }: CardStores,
  { userId, widget, now, timeZone }: GeneratedCard,
): Promise<void> => {
  const tasks = generatedTaskValues(widget, now);
  if (tasks.length > 0) await saveTasks?.(userId, tasks);
  const habit = generatedHabit(widget, localDay(now, timeZone));
  if (habit !== null) await saveHabit?.(userId, habit);
};

/**
 * Builds the saver for a signed-in user's finished card: a TaskList's tasks or a
 * HabitStreakCard's habit. It runs after the card is on screen, so a failure is only logged.
 */
export const createSaveGeneratedCard =
  (stores: CardStores) =>
  async (card: GeneratedCard): Promise<void> => {
    try {
      await saveWidget(stores, card);
    } catch (error) {
      logError('saving the card failed', error);
    }
  };
