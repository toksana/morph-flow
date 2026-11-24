import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildSavedHabitViews } from '../test/factories/savedHabit.factory';

import { applyHabitCheckIn, checkInHabitRequestSchema, summarizeHabits } from './habitCheckIn';

const RANDOM_RUNS = 50;
const MAX_HABITS = 10;

const randomHabits = () => buildSavedHabitViews(faker.number.int({ min: 1, max: MAX_HABITS }));

describe('applyHabitCheckIn', () => {
  it('changes the target only, keeping order and length, for random lists', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const habits = randomHabits();
      const target = faker.helpers.arrayElement(habits);
      const done = faker.datatype.boolean();

      // Act
      const result = applyHabitCheckIn(habits, { habitId: target.id, done });

      // Assert
      expect(result.map((habit) => habit.id)).toEqual(habits.map((habit) => habit.id));
      result.forEach((habit, index) => {
        if (habit.id === target.id) expect(habit.doneToday).toBe(done);
        else expect(habit).toEqual(habits[index]);
      });
    });
  });

  it('adds today to the streak on a check-in and takes it off on undo', () => {
    // Arrange
    const [open] = buildSavedHabitViews(1, { doneToday: false });

    // Act
    const checkedIn = applyHabitCheckIn([open], { habitId: open.id, done: true });
    const undone = applyHabitCheckIn(checkedIn, { habitId: open.id, done: false });

    // Assert
    expect(checkedIn[0].streakDays).toBe(open.streakDays + 1);
    expect(undone).toEqual([open]);
  });

  it('leaves the streak alone when the habit is already in that state', () => {
    // Arrange
    const habits = randomHabits();
    const target = faker.helpers.arrayElement(habits);

    // Act
    const result = applyHabitCheckIn(habits, { habitId: target.id, done: target.doneToday });

    // Assert
    expect(result).toEqual(habits);
  });

  it('never takes a streak below 0', () => {
    // Arrange
    const [habit] = buildSavedHabitViews(1, { doneToday: true, streakDays: 0 });

    // Act
    const [result] = applyHabitCheckIn([habit], { habitId: habit.id, done: false });

    // Assert
    expect(result.streakDays).toBe(0);
  });

  it('does not change the list it was given, nor for an unknown id', () => {
    // Arrange
    const habits = randomHabits();
    const before = structuredClone(habits);

    // Act
    const result = applyHabitCheckIn(habits, { habitId: faker.string.uuid(), done: true });
    applyHabitCheckIn(habits, { habitId: habits[0].id, done: !habits[0].doneToday });

    // Assert
    expect(result).toEqual(before);
    expect(habits).toEqual(before);
  });
});

describe('summarizeHabits', () => {
  it('counts the habits done today out of all of them, for random lists', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const habits = randomHabits();

      // Act
      const result = summarizeHabits(habits);

      // Assert
      expect(result).toEqual({
        doneCount: habits.filter((habit) => habit.doneToday).length,
        totalCount: habits.length,
      });
    });
  });

  it('counts 0 of 0 for no habits', () => {
    // Act
    const result = summarizeHabits([]);

    // Assert
    expect(result).toEqual({ doneCount: 0, totalCount: 0 });
  });
});

describe('checkInHabitRequestSchema', () => {
  it('accepts a habit id and a done flag', () => {
    // Arrange
    const request = { habitId: faker.string.uuid(), done: faker.datatype.boolean() };

    // Act
    const result = checkInHabitRequestSchema.safeParse(request);

    // Assert
    expect(result.data).toEqual(request);
  });

  it.each([[undefined], [{ habitId: 'habit-0', done: true }], [{ habitId: faker.string.uuid() }]])(
    'rejects %j',
    (input) => {
      // Act
      const result = checkInHabitRequestSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    },
  );
});
