'use server';

import { refresh } from 'next/cache';

import type { CheckInHabitResult } from '@/core/habits/habitCheckIn';
import { getDb } from '@/server/db/client';
import { setHabitCheckIn } from '@/server/db/habits';
import { createCheckInHabit } from '@/server/habits/checkInHabit';

import { findCaller, identifyCaller } from '../_tasks/deps';

const checkInHabit = createCheckInHabit({
  identify: identifyCaller,
  findUser: findCaller,
  setHabitCheckIn: async (userId, habitId, day, done) =>
    setHabitCheckIn(getDb(), userId, habitId, day, done),
});

/**
 * Checks a saved habit in for today or undoes it. On success the page's Server Components render
 * again in the same round trip, so the optimistic streak gives way to the counted one.
 */
export const checkInHabitAction = async (input: unknown): Promise<CheckInHabitResult> => {
  const result = await checkInHabit(input);
  if (result.ok) refresh();
  return result;
};
