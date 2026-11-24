import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { addDays } from './habitDay';
import { countStreak } from './habitStreak';

const RANDOM_RUNS = 100;
const MAX_RUN = 60;
const MAX_BASE = 365;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

const randomDay = (): string =>
  faker.date
    .between({ from: '2000-01-01T00:00:00Z', to: '2080-12-31T00:00:00Z' })
    .toISOString()
    .slice(0, ISO_DATE_LENGTH);

/** `length` consecutive days that end on `lastDay`, oldest first. */
const daysEndingOn = (lastDay: string, length: number): string[] =>
  Array.from({ length }, (_, index) => addDays(lastDay, index - length + 1));

const randomBase = (): number => faker.number.int({ min: 0, max: MAX_BASE });
const randomRun = (): number => faker.number.int({ min: 1, max: MAX_RUN });

describe('countStreak', () => {
  it('counts only the base for a habit saved today and not checked in yet', () => {
    // Arrange
    const today = randomDay();
    const streakBase = randomBase();

    // Act
    const result = countStreak({ checkInDays: [], startDay: today, streakBase, today });

    // Assert
    expect(result).toBe(streakBase);
  });

  it('breaks to 0 once a whole day since the start was missed', () => {
    // Arrange
    const today = randomDay();
    const startDay = addDays(today, -faker.number.int({ min: 1, max: MAX_RUN }));

    // Act
    const result = countStreak({ checkInDays: [], startDay, streakBase: randomBase(), today });

    // Assert
    expect(result).toBe(0);
  });

  it('adds the base to an unbroken run from the start, ending today or yesterday', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const today = randomDay();
      const run = randomRun();
      const lastDay = faker.datatype.boolean() ? today : addDays(today, -1);
      const checkInDays = daysEndingOn(lastDay, run);
      const streakBase = randomBase();

      // Act
      const result = countStreak({ checkInDays, startDay: checkInDays[0], streakBase, today });

      // Assert
      expect(result).toBe(run + streakBase);
    });
  });

  it('counts only the run after a missed day, without the base', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const today = randomDay();
      const run = randomRun();
      const recent = daysEndingOn(today, run);
      const gapDay = addDays(recent[0], -1);
      const older = daysEndingOn(addDays(gapDay, -1), randomRun());

      // Act
      const result = countStreak({
        checkInDays: faker.helpers.shuffle([...older, ...recent]),
        startDay: older[0],
        streakBase: randomBase(),
        today,
      });

      // Assert
      expect(result).toBe(run);
    });
  });

  it('drops the base when the start day itself was missed', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const today = randomDay();
      const run = randomRun();
      const checkInDays = daysEndingOn(today, run);
      const startDay = addDays(checkInDays[0], -1);

      // Act
      const result = countStreak({ checkInDays, startDay, streakBase: randomBase() + 1, today });

      // Assert
      expect(result).toBe(run);
    });
  });

  it("grows by exactly 1 when today's check-in is added, for random logs", () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const today = randomDay();
      const startDay = addDays(today, -faker.number.int({ min: 0, max: MAX_RUN }));
      const yesterday = addDays(today, -1);
      const checkInDays = faker.helpers.arrayElements(
        daysEndingOn(yesterday, MAX_RUN).filter((day) => day >= startDay),
      );
      const input = { checkInDays, startDay, streakBase: randomBase(), today };

      // Act
      const before = countStreak(input);
      const after = countStreak({ ...input, checkInDays: [...checkInDays, today] });

      // Assert
      expect(after).toBe(before + 1);
    });
  });

  it('ignores check-ins after today and before the start', () => {
    // Arrange
    const today = randomDay();
    const startDay = addDays(today, -1);
    const input = { checkInDays: [startDay], startDay, streakBase: 0, today };

    // Act
    const result = countStreak({
      ...input,
      checkInDays: [addDays(startDay, -2), startDay, addDays(today, 1)],
    });

    // Assert
    expect(result).toBe(countStreak(input));
    expect(result).toBe(1);
  });

  it('never goes below 0, even for a negative base', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const today = randomDay();
      const startDay = addDays(today, faker.number.int({ min: -MAX_RUN, max: 1 }));

      // Act
      const result = countStreak({
        checkInDays: faker.helpers.arrayElements(daysEndingOn(today, MAX_RUN)),
        startDay,
        streakBase: faker.number.int({ min: -MAX_BASE, max: MAX_BASE }),
        today,
      });

      // Assert
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
