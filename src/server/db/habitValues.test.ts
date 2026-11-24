import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildHabitStreakCard } from '@/core/test/factories/habitStreakCard.factory';
import { buildTaskList } from '@/core/test/factories/taskList.factory';

import { generatedHabit, toGeneratedHabit } from './habitValues';

const RANDOM_RUNS = 50;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

const randomDay = (): string => faker.date.recent().toISOString().slice(0, ISO_DATE_LENGTH);

describe('toGeneratedHabit', () => {
  it("keeps the model's streak: base plus today's check-in equals streakDays", () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const card = buildHabitStreakCard({ streakDays: faker.number.int({ min: 1, max: 400 }) });
      const today = randomDay();

      // Act
      const { values, checkInDay } = toGeneratedHabit(card, today);

      // Assert
      expect(values.streakBase).toBeGreaterThanOrEqual(0);
      expect((values.streakBase ?? 0) + (checkInDay === null ? 0 : 1)).toBe(card.streakDays);
      expect(checkInDay).toBe(card.completedToday ? today : null);
      expect(values.startDay).toBe(today);
      expect(values.targetDays).toBe(card.targetDays);
    });
  });

  it('never stores a negative base, even for a done-today card with a 0 streak', () => {
    // Arrange
    const card = buildHabitStreakCard({ streakDays: 0, completedToday: true });

    // Act
    const { values, checkInDay } = toGeneratedHabit(card, randomDay());

    // Assert
    expect(values.streakBase).toBe(0);
    expect(checkInDay).not.toBeNull();
  });

  it('trims the title and the emoji, and stores a blank emoji as null', () => {
    // Arrange
    const title = faker.lorem.words(3);
    const emoji = faker.internet.emoji();

    // Act
    const trimmed = toGeneratedHabit(
      buildHabitStreakCard({ title: `  ${title}\n`, emoji: ` ${emoji} ` }),
      randomDay(),
    );
    const blank = toGeneratedHabit(buildHabitStreakCard({ emoji: '  ' }), randomDay());
    const missing = toGeneratedHabit(buildHabitStreakCard({ emoji: undefined }), randomDay());

    // Assert
    expect(trimmed.values.title).toBe(title);
    expect(trimmed.values.emoji).toBe(emoji);
    expect(blank.values.emoji).toBeNull();
    expect(missing.values.emoji).toBeNull();
  });
});

describe('generatedHabit', () => {
  it('maps a HabitStreakCard', () => {
    // Arrange
    const card = buildHabitStreakCard();
    const today = randomDay();

    // Act
    const result = generatedHabit(card, today);

    // Assert
    expect(result).toEqual(toGeneratedHabit(card, today));
  });

  it('gives nothing to save for a TaskList', () => {
    // Act
    const result = generatedHabit(buildTaskList(), randomDay());

    // Assert
    expect(result).toBeNull();
  });
});
