import { faker } from '@faker-js/faker';

import { buildHabitStreakCard } from '@/core/test/factories/habitStreakCard.factory';

import type { HabitWithCheckIns } from '../db/habits';

const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;
const MAX_CHECK_INS = 30;

const isoDay = (date: Date): string => date.toISOString().slice(0, ISO_DATE_LENGTH);

/** A saved habit as `listHabits` returns it, with random check-ins, built without a database. */
export const buildHabitWithCheckIns = (
  overrides: Partial<HabitWithCheckIns> = {},
): HabitWithCheckIns => {
  const { title, emoji, targetDays, streakDays } = buildHabitStreakCard();
  const createdAt = faker.date.recent({ days: MAX_CHECK_INS });
  const checkInDays = faker.date
    .betweens({ from: createdAt, to: new Date(), count: { min: 0, max: MAX_CHECK_INS } })
    .map(isoDay);
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    title,
    emoji: emoji ?? null,
    targetDays,
    streakBase: streakDays,
    startDay: isoDay(createdAt),
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    checkInDays: [...new Set(checkInDays)],
    ...overrides,
  };
};

export const buildHabitsWithCheckIns = (count: number): HabitWithCheckIns[] =>
  Array.from({ length: count }, () => buildHabitWithCheckIns());
