import { faker } from '@faker-js/faker';
import { and, eq } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { addDays } from '@/core/habits/habitDay';
import { buildHabitStreakCard } from '@/core/test/factories/habitStreakCard.factory';

import { createTestUsers } from '../test/dbUsers';
import { getDb } from './client';
import { createHabit, listHabits, setHabitCheckIn } from './habits';
import { toGeneratedHabit } from './habitValues';
import { habitCheckIns } from './tables/habitCheckIns';
import { habits } from './tables/habits';

const testUsers = createTestUsers();
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

const randomDay = (): string => faker.date.recent().toISOString().slice(0, ISO_DATE_LENGTH);

const saveHabit = async (userId: string, completedToday = false, today = randomDay()) =>
  createHabit(getDb(), userId, toGeneratedHabit(buildHabitStreakCard({ completedToday }), today));

const readCheckIn = async (habitId: string, day: string) => {
  const [row] = await getDb()
    .select()
    .from(habitCheckIns)
    .where(and(eq(habitCheckIns.habitId, habitId), eq(habitCheckIns.day, day)));
  return row;
};

const checkInDaysOf = async (userId: string, habitId: string): Promise<string[] | undefined> =>
  (await listHabits(getDb(), userId)).find((habit) => habit.id === habitId)?.checkInDays;

describe('habits repository', () => {
  afterEach(async () => {
    await testUsers.cleanUp();
  });

  it('saves generated habits and lists them back in creation order with their values', async () => {
    // Arrange
    const userId = await testUsers.create();
    const today = randomDay();
    const generated = Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
      toGeneratedHabit(buildHabitStreakCard(), today),
    );

    // Act
    const ids: string[] = [];
    for (const habit of generated) ids.push(await createHabit(getDb(), userId, habit));
    const listed = await listHabits(getDb(), userId);

    // Assert
    expect(listed.map((habit) => habit.id)).toEqual(ids);
    listed.forEach((habit, index) => {
      const { values, checkInDay } = generated[index];
      expect(habit).toMatchObject(values);
      expect(habit.checkInDays).toEqual(checkInDay === null ? [] : [checkInDay]);
    });
  });

  it('lists check-in days as ISO strings, oldest first', async () => {
    // Arrange
    const userId = await testUsers.create();
    const today = randomDay();
    const habitId = await saveHabit(userId, false, addDays(today, -3));
    const days = [today, addDays(today, -2), addDays(today, -1)];

    // Act
    for (const day of days) await setHabitCheckIn(getDb(), userId, habitId, day, true);

    // Assert
    expect(await checkInDaysOf(userId, habitId)).toEqual([...days].sort());
  });

  it('checks in idempotently: a second check-in changes nothing, updated_at included', async () => {
    // Arrange
    const userId = await testUsers.create();
    const today = randomDay();
    const habitId = await saveHabit(userId, false, today);

    // Act
    const first = await setHabitCheckIn(getDb(), userId, habitId, today, true);
    const before = await readCheckIn(habitId, today);
    const again = await setHabitCheckIn(getDb(), userId, habitId, today, true);

    // Assert
    expect([first, again]).toEqual([true, true]);
    expect(await readCheckIn(habitId, today)).toEqual(before);
    expect(await checkInDaysOf(userId, habitId)).toEqual([today]);
  });

  it('undoes a check-in by keeping the row as a tombstone, and checks in again on the same row', async () => {
    // Arrange
    const userId = await testUsers.create();
    const today = randomDay();
    const habitId = await saveHabit(userId, true, today);
    const original = await readCheckIn(habitId, today);

    // Act
    const undone = await setHabitCheckIn(getDb(), userId, habitId, today, false);
    const tombstone = await readCheckIn(habitId, today);
    const listedAfterUndo = await checkInDaysOf(userId, habitId);
    const redone = await setHabitCheckIn(getDb(), userId, habitId, today, true);

    // Assert
    expect([undone, redone]).toEqual([true, true]);
    expect(tombstone.deletedAt).toBeInstanceOf(Date);
    expect(listedAfterUndo).toEqual([]);
    expect(await readCheckIn(habitId, today)).toMatchObject({ id: original.id, deletedAt: null });
    expect(await checkInDaysOf(userId, habitId)).toEqual([today]);
  });

  it('accepts an undo when there is nothing to undo', async () => {
    // Arrange
    const userId = await testUsers.create();
    const today = randomDay();
    const habitId = await saveHabit(userId, false, today);

    // Act
    const undone = await setHabitCheckIn(getDb(), userId, habitId, today, false);

    // Assert
    expect(undone).toBe(true);
    expect(await readCheckIn(habitId, today)).toBeUndefined();
  });

  it("does not let a user check in or undo another user's habit", async () => {
    // Arrange
    const owner = await testUsers.create();
    const intruder = await testUsers.create();
    const today = randomDay();
    const checkedId = await saveHabit(owner, true, today);
    const openId = await saveHabit(owner, false, today);

    // Act
    const undone = await setHabitCheckIn(getDb(), intruder, checkedId, today, false);
    const checkedIn = await setHabitCheckIn(getDb(), intruder, openId, today, true);

    // Assert
    expect([undone, checkedIn]).toEqual([false, false]);
    expect(await checkInDaysOf(owner, checkedId)).toEqual([today]);
    expect(await checkInDaysOf(owner, openId)).toEqual([]);
    expect(await listHabits(getDb(), intruder)).toEqual([]);
  });

  it('leaves a deleted habit alone and leaves it out of the list', async () => {
    // Arrange
    const userId = await testUsers.create();
    const today = randomDay();
    const habitId = await saveHabit(userId, true, today);
    await getDb().update(habits).set({ deletedAt: new Date() }).where(eq(habits.id, habitId));

    // Act
    const undone = await setHabitCheckIn(getDb(), userId, habitId, today, false);
    const checkedIn = await setHabitCheckIn(getDb(), userId, habitId, addDays(today, 1), true);

    // Assert
    expect([undone, checkedIn]).toEqual([false, false]);
    expect((await readCheckIn(habitId, today)).deletedAt).toBeNull();
    expect(await readCheckIn(habitId, addDays(today, 1))).toBeUndefined();
    expect(await listHabits(getDb(), userId)).toEqual([]);
  });

  it('returns false for a habit id that does not exist', async () => {
    // Arrange
    const userId = await testUsers.create();

    // Act
    const result = await setHabitCheckIn(getDb(), userId, faker.string.uuid(), randomDay(), true);

    // Assert
    expect(result).toBe(false);
  });
});
