import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildHabitStreakCard } from '../test/factories/habitStreakCard.factory';

import { habitStreakCardSchema, MAX_TARGET_DAYS, MIN_TARGET_DAYS } from './habitStreakCard.schema';

const RANDOM_RUNS = 50;

describe('habitStreakCardSchema', () => {
  it('accepts every randomly generated valid card', () => {
    // Arrange
    const cards = Array.from({ length: RANDOM_RUNS }, () => buildHabitStreakCard());

    // Act
    const results = cards.map((card) => habitStreakCardSchema.safeParse(card).success);

    // Assert
    expect(results).not.toContain(false);
  });

  it('accepts a card without an emoji', () => {
    // Arrange
    const card = buildHabitStreakCard({ emoji: undefined });

    // Act
    const result = habitStreakCardSchema.safeParse(card);

    // Assert
    expect(result.success).toBe(true);
  });

  it('accepts a zero streak', () => {
    // Arrange
    const card = buildHabitStreakCard({ streakDays: 0 });

    // Act
    const result = habitStreakCardSchema.safeParse(card);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([-1, 2.5])('rejects the streak %d', (streakDays) => {
    // Arrange
    const card = buildHabitStreakCard({ streakDays });

    // Act
    const result = habitStreakCardSchema.safeParse(card);

    // Assert
    expect(result.success).toBe(false);
  });

  it.each([MIN_TARGET_DAYS, MAX_TARGET_DAYS])('accepts the boundary target %i', (targetDays) => {
    // Arrange
    const card = buildHabitStreakCard({ targetDays });

    // Act
    const result = habitStreakCardSchema.safeParse(card);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([MIN_TARGET_DAYS - 1, MAX_TARGET_DAYS + 1, 2.5])(
    'rejects the target %d',
    (targetDays) => {
      // Arrange
      const card = buildHabitStreakCard({ targetDays });

      // Act
      const result = habitStreakCardSchema.safeParse(card);

      // Assert
      expect(result.success).toBe(false);
    },
  );

  it('rejects a card without completedToday', () => {
    // Arrange
    const card = { ...buildHabitStreakCard(), completedToday: undefined };

    // Act
    const result = habitStreakCardSchema.safeParse(card);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects a widget type other than HabitStreakCard', () => {
    // Arrange
    const card = { ...buildHabitStreakCard(), type: faker.lorem.word() };

    // Act
    const result = habitStreakCardSchema.safeParse(card);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects an empty title', () => {
    // Arrange
    const card = buildHabitStreakCard({ title: '' });

    // Act
    const result = habitStreakCardSchema.safeParse(card);

    // Assert
    expect(result.success).toBe(false);
  });
});
