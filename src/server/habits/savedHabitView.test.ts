import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { addDays } from '@/core/habits/habitDay';
import { countStreak } from '@/core/habits/habitStreak';

import { buildHabitWithCheckIns } from '../test/habitRows';
import { toSavedHabitView } from './savedHabitView';

const RANDOM_RUNS = 50;

const todayOf = () => new Date().toISOString().slice(0, 'YYYY-MM-DD'.length);

describe('toSavedHabitView', () => {
  it('counts the streak for today and is done exactly when today is checked in', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const habit = buildHabitWithCheckIns();
      const today = todayOf();

      // Act
      const view = toSavedHabitView(habit, today);

      // Assert
      expect(view).toEqual({
        id: habit.id,
        title: habit.title,
        emoji: habit.emoji ?? undefined,
        streakDays: countStreak({ ...habit, today }),
        targetDays: habit.targetDays,
        doneToday: habit.checkInDays.includes(today),
      });
    });
  });

  it('counts a habit checked in every day since it was saved, plus its base', () => {
    // Arrange
    const today = todayOf();
    const days = faker.number.int({ min: 1, max: 20 });
    const startDay = addDays(today, 1 - days);
    const habit = buildHabitWithCheckIns({
      startDay,
      checkInDays: Array.from({ length: days }, (_, index) => addDays(startDay, index)),
    });

    // Act
    const view = toSavedHabitView(habit, today);

    // Assert
    expect(view.streakDays).toBe(habit.streakBase + days);
    expect(view.doneToday).toBe(true);
  });

  it('leaves out the owner, timestamps and the raw log, which the client has no use for', () => {
    // Act
    const view = toSavedHabitView(buildHabitWithCheckIns({ emoji: null }), todayOf());

    // Assert
    expect(Object.keys(view).sort()).toEqual(
      ['doneToday', 'emoji', 'id', 'streakDays', 'targetDays', 'title'].sort(),
    );
    expect(view.emoji).toBeUndefined();
  });
});
