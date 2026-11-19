import { faker } from '@faker-js/faker';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { formatDueDate } from './formatDueDate';

const RANDOM_RUNS = 50;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;
const LOCALE = 'en-US';
// West of UTC, local-time formatting of a UTC-midnight date lands on the previous day.
const WEST_OF_UTC_TIME_ZONE = 'Pacific/Honolulu';

describe('formatDueDate', () => {
  // The boundary rule bans `process` in src/core; tests need it to pin the host time zone.
  // eslint-disable-next-line no-restricted-globals
  const env = process.env;
  const originalTimeZone = env.TZ;

  beforeAll(() => {
    env.TZ = WEST_OF_UTC_TIME_ZONE;
  });

  afterAll(() => {
    env.TZ = originalTimeZone;
  });

  it('keeps the calendar day and year for random dates in a time zone west of UTC', () => {
    // Arrange
    const dates = Array.from({ length: RANDOM_RUNS }, () =>
      faker.date.soon({ days: 365 }).toISOString().slice(0, ISO_DATE_LENGTH),
    );

    // Act
    const formatted = dates.map((date) => formatDueDate(date, LOCALE));

    // Assert
    formatted.forEach((text, index) => {
      const [year, , day] = dates[index].split('-');
      expect(text).toContain(String(Number(day)));
      expect(text).toContain(year);
    });
  });

  it.each([
    ['2026-01-01', 'Jan 1, 2026'],
    ['2026-12-31', 'Dec 31, 2026'],
    ['2028-02-29', 'Feb 29, 2028'],
  ])('formats %s as %s', (date, expected) => {
    // Act
    const text = formatDueDate(date, LOCALE);

    // Assert
    expect(text).toBe(expected);
  });

  it('follows the given locale', () => {
    // Act
    const text = formatDueDate('2026-03-05', 'de-DE');

    // Assert
    expect(text).toBe('5. März 2026');
  });
});
