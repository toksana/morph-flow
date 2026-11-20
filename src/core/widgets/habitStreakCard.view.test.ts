import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { buildHabitStreakCard } from '../test/factories/habitStreakCard.factory';

import { DEFAULT_TARGET_DAYS, MIN_TARGET_DAYS } from './habitStreakCard.schema';
import { applyTodayMark, toHabitStreakView } from './habitStreakCard.view';

const RANDOM_RUNS = 50;
const MAX_RANDOM_STREAK = 400;

const randomCards = () => Array.from({ length: RANDOM_RUNS }, () => buildHabitStreakCard());

describe('applyTodayMark', () => {
  it('keeps the streak when the mark matches the streamed value', () => {
    // Arrange
    const streak = faker.number.int({ min: 0, max: MAX_RANDOM_STREAK });
    const done = faker.datatype.boolean();

    // Act
    const result = applyTodayMark(streak, done, done);

    // Assert
    expect(result).toBe(streak);
  });

  it('adds today when the user marks it done', () => {
    // Arrange
    const streak = faker.number.int({ min: 0, max: MAX_RANDOM_STREAK });

    // Act
    const result = applyTodayMark(streak, false, true);

    // Assert
    expect(result).toBe(streak + 1);
  });

  it('removes today when the user undoes it', () => {
    // Arrange
    const streak = faker.number.int({ min: 1, max: MAX_RANDOM_STREAK });

    // Act
    const result = applyTodayMark(streak, true, false);

    // Assert
    expect(result).toBe(streak - 1);
  });

  it('never goes below zero when undoing a zero streak', () => {
    // Act
    const result = applyTodayMark(0, true, false);

    // Assert
    expect(result).toBe(0);
  });
});

describe('toHabitStreakView', () => {
  it('returns defaults before anything has streamed', () => {
    // Act
    const view = toHabitStreakView(undefined);

    // Assert
    expect(view).toEqual({
      title: '',
      emoji: undefined,
      streakDays: 0,
      targetDays: DEFAULT_TARGET_DAYS,
      completedToday: false,
      goalPercent: 0,
      daysLeft: DEFAULT_TARGET_DAYS,
      goalReached: false,
      hasProgress: false,
    });
  });

  it('keeps progress consistent for random cards and marks', () => {
    // Arrange
    const inputs = randomCards().map((card) => [card, faker.datatype.boolean()] as const);

    // Act
    const views = inputs.map(([card, mark]) => toHabitStreakView(card, mark));

    // Assert
    views.forEach((view) => {
      expect(view.streakDays).toBeGreaterThanOrEqual(0);
      expect(view.goalPercent).toBeGreaterThanOrEqual(0);
      expect(view.goalPercent).toBeLessThanOrEqual(100);
      expect(view.daysLeft).toBe(Math.max(0, view.targetDays - view.streakDays));
      expect(view.goalReached).toBe(view.streakDays >= view.targetDays);
    });
  });

  it('shows the streamed card again once the mark is toggled back', () => {
    // Arrange
    const cards = randomCards();

    // Act
    const toggledBack = cards.map((card) => toHabitStreakView(card, card.completedToday));

    // Assert
    expect(toggledBack).toEqual(cards.map((card) => toHabitStreakView(card)));
  });

  it('uses the local mark over the streamed one', () => {
    // Arrange
    const card = buildHabitStreakCard({ completedToday: false });

    // Act
    const view = toHabitStreakView(card, true);

    // Assert
    expect(view.completedToday).toBe(true);
    expect(view.streakDays).toBe(card.streakDays + 1);
  });

  it('counts today when it is done but the streamed streak is 0', () => {
    // Arrange
    const card = buildHabitStreakCard({ streakDays: 0, completedToday: true });

    // Act
    const view = toHabitStreakView(card);

    // Assert
    expect(view.streakDays).toBe(1);
    expect(toHabitStreakView(card, false).streakDays).toBe(0);
  });

  it('never shows a done-today card with an empty streak', () => {
    // Arrange
    const cards = randomCards().map((card) => ({ ...card, streakDays: 0, completedToday: true }));

    // Act
    const views = cards.map((card) => toHabitStreakView(card));

    // Assert
    views.forEach((view) => expect(view.streakDays).toBeGreaterThanOrEqual(1));
  });

  it('caps progress at 100 percent once the streak passes the target', () => {
    // Arrange
    const targetDays = faker.number.int({ min: 1, max: 30 });
    const card = buildHabitStreakCard({ targetDays, streakDays: targetDays * 2 });

    // Act
    const view = toHabitStreakView(card);

    // Assert
    expect(view.goalPercent).toBe(100);
    expect(view.daysLeft).toBe(0);
    expect(view.goalReached).toBe(true);
  });

  it('counts the goal as reached on the exact target day', () => {
    // Arrange
    const targetDays = faker.number.int({ min: 1, max: 30 });
    const card = buildHabitStreakCard({ targetDays, streakDays: targetDays });

    // Act
    const view = toHabitStreakView(card);

    // Assert
    expect(view.goalReached).toBe(true);
    expect(view.goalPercent).toBe(100);
    expect(view.daysLeft).toBe(0);
  });

  it('rounds the progress to a whole percent', () => {
    // Arrange
    const card = buildHabitStreakCard({ streakDays: 18, targetDays: 30, completedToday: true });

    // Act
    const view = toHabitStreakView(card);

    // Assert
    expect(view.goalPercent).toBe(60);
    expect(view.daysLeft).toBe(12);
  });

  it.each([
    [{ streakDays: 3 }, false],
    [{ targetDays: 30 }, false],
    [{ streakDays: 3, targetDays: 30 }, true],
  ])('reports progress for %j as %s', (partial, expected) => {
    // Act
    const view = toHabitStreakView(partial);

    // Assert
    expect(view.hasProgress).toBe(expected);
  });

  it('hides a blank title and emoji that are still streaming', () => {
    // Arrange
    const partial = { title: '  ', emoji: '' };

    // Act
    const view = toHabitStreakView(partial);

    // Assert
    expect(view.title).toBe('');
    expect(view.emoji).toBeUndefined();
  });

  it('keeps the target at least one day when the model sends zero', () => {
    // Arrange
    const partial = { targetDays: 0 };

    // Act
    const view = toHabitStreakView(partial);

    // Assert
    expect(view.targetDays).toBe(MIN_TARGET_DAYS);
  });
});
