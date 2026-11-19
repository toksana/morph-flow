import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { formatPromptDate, isValidTimeZone } from './promptDate';

const RANDOM_RUNS = 100;
const HOUR_MS = 60 * 60 * 1000;
const ISO_DATE_LENGTH = 'YYYY-MM-DD'.length;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// IANA fixed-offset zones span UTC-12..UTC+14.
const MIN_OFFSET_HOURS = -12;
const MAX_OFFSET_HOURS = 14;

/** "Etc/GMT-3" is UTC+3: the sign in these IANA names is inverted. */
const fixedOffsetZone = (offsetHours: number): string =>
  offsetHours === 0 ? 'Etc/GMT' : `Etc/GMT${offsetHours > 0 ? '-' : '+'}${Math.abs(offsetHours)}`;

/** Independent oracle: shift the instant by the offset and read the UTC calendar day. */
const expectedPromptDate = (now: Date, offsetHours: number): string => {
  const shifted = new Date(now.getTime() + offsetHours * HOUR_MS);
  return `${WEEKDAYS[shifted.getUTCDay()]}, ${shifted.toISOString().slice(0, ISO_DATE_LENGTH)}`;
};

describe('formatPromptDate', () => {
  it('matches the calendar day of random instants in random fixed-offset zones', () => {
    // Arrange
    const cases = Array.from({ length: RANDOM_RUNS }, () => ({
      now: faker.date.anytime(),
      offsetHours: faker.number.int({ min: MIN_OFFSET_HOURS, max: MAX_OFFSET_HOURS }),
    }));

    // Act
    const results = cases.map(({ now, offsetHours }) =>
      formatPromptDate(now, fixedOffsetZone(offsetHours)),
    );

    // Assert
    results.forEach((result, index) => {
      const { now, offsetHours } = cases[index];
      expect(result).toBe(expectedPromptDate(now, offsetHours));
    });
  });

  it.each([
    ['Europe/Moscow', 'Friday, 2026-11-20'],
    ['Pacific/Kiritimati', 'Friday, 2026-11-20'],
    ['UTC', 'Thursday, 2026-11-19'],
    ['Etc/GMT+12', 'Thursday, 2026-11-19'],
  ])('resolves 22:30 UTC on a Thursday to the local day in %s', (timeZone, expected) => {
    // Arrange
    const lateThursdayUtc = new Date('2026-11-19T22:30:00Z');

    // Act
    const result = formatPromptDate(lateThursdayUtc, timeZone);

    // Assert
    expect(result).toBe(expected);
  });
});

describe('isValidTimeZone', () => {
  it.each(['UTC', 'Europe/Moscow', 'America/Los_Angeles', 'Asia/Kolkata', 'Etc/GMT+12'])(
    'accepts %s',
    (timeZone) => {
      // Act
      const result = isValidTimeZone(timeZone);

      // Assert
      expect(result).toBe(true);
    },
  );

  it.each(['', 'Mars/Olympus', 'Europe/Moskva', 'GMT+25', 'not a zone'])(
    'rejects %j',
    (timeZone) => {
      // Act
      const result = isValidTimeZone(timeZone);

      // Assert
      expect(result).toBe(false);
    },
  );
});
