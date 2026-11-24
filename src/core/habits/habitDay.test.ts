import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { addDays } from './habitDay';

const RANDOM_RUNS = 100;
const MAX_SHIFT = 1000;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;

const randomDay = (): string =>
  faker.date
    .between({ from: '1990-01-01T00:00:00Z', to: '2090-12-31T00:00:00Z' })
    .toISOString()
    .slice(0, ISO_DATE_LENGTH);

/** Independent oracle: the calendar arithmetic of `Date.setUTCDate`. */
const expectedDay = (day: string, days: number): string => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, ISO_DATE_LENGTH);
};

describe('addDays', () => {
  it('matches calendar arithmetic and undoes itself, for random days and shifts', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const day = randomDay();
      const shift = faker.number.int({ min: -MAX_SHIFT, max: MAX_SHIFT });

      // Act
      const shifted = addDays(day, shift);

      // Assert
      expect(shifted).toBe(expectedDay(day, shift));
      expect(addDays(shifted, -shift)).toBe(day);
    });
  });

  it('keeps the day for a shift of 0', () => {
    // Arrange
    const day = randomDay();

    // Act
    const result = addDays(day, 0);

    // Assert
    expect(result).toBe(day);
  });

  it.each([
    ['2026-03-01', -1, '2026-02-28'],
    ['2028-03-01', -1, '2028-02-29'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2026-03-29', 1, '2026-03-30'],
  ])('moves %s by %i to %s across month, leap and year boundaries', (day, shift, expected) => {
    // Act
    const result = addDays(day, shift);

    // Assert
    expect(result).toBe(expected);
  });
});
