import { faker } from '@faker-js/faker';

import type { SavedHabitView } from '../../habits/habitCheckIn';
import { MAX_TARGET_DAYS, MIN_TARGET_DAYS } from '../../widgets/habitStreakCard.schema';

const MAX_RANDOM_STREAK = 400;

/** A saved habit as the client sees it: a database id and a counted streak. */
export const buildSavedHabitView = (overrides: Partial<SavedHabitView> = {}): SavedHabitView => {
  const doneToday = faker.datatype.boolean();
  return {
    id: faker.string.uuid(),
    title: faker.lorem.words({ min: 2, max: 4 }),
    emoji: faker.helpers.maybe(() => faker.internet.emoji()),
    // A habit done today has a streak of at least that day.
    streakDays: faker.number.int({ min: doneToday ? 1 : 0, max: MAX_RANDOM_STREAK }),
    targetDays: faker.number.int({ min: MIN_TARGET_DAYS, max: MAX_TARGET_DAYS }),
    doneToday,
    ...overrides,
  };
};

export const buildSavedHabitViews = (
  count: number,
  overrides: Partial<SavedHabitView> = {},
): SavedHabitView[] => Array.from({ length: count }, () => buildSavedHabitView(overrides));
