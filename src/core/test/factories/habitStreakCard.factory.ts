import { faker } from '@faker-js/faker';

import {
  HABIT_STREAK_CARD_TYPE,
  type HabitStreakCard,
  MAX_TARGET_DAYS,
  MIN_TARGET_DAYS,
} from '../../widgets/habitStreakCard.schema';

/** Lets a streak overshoot the largest target, so "goal reached" cases appear too. */
const MAX_RANDOM_STREAK = MAX_TARGET_DAYS + 30;

export const buildHabitStreakCard = (
  overrides: Partial<HabitStreakCard> = {},
): HabitStreakCard => ({
  type: HABIT_STREAK_CARD_TYPE,
  title: faker.lorem.words({ min: 2, max: 4 }),
  emoji: faker.helpers.maybe(() => faker.internet.emoji()),
  streakDays: faker.number.int({ min: 0, max: MAX_RANDOM_STREAK }),
  targetDays: faker.number.int({ min: MIN_TARGET_DAYS, max: MAX_TARGET_DAYS }),
  completedToday: faker.datatype.boolean(),
  ...overrides,
});
