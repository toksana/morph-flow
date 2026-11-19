import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { completionPercent, nonBlank } from './viewUtils';

const RANDOM_RUNS = 50;
const MAX_RANDOM_TOTAL = 100;

describe('completionPercent', () => {
  it('stays within 0..100 for random counts', () => {
    // Arrange
    const pairs = Array.from({ length: RANDOM_RUNS }, () => {
      const total = faker.number.int({ min: 0, max: MAX_RANDOM_TOTAL });
      return [faker.number.int({ min: 0, max: total }), total] as const;
    });

    // Act
    const percents = pairs.map(([done, total]) => completionPercent(done, total));

    // Assert
    percents.forEach((percent) => {
      expect(percent).toBeGreaterThanOrEqual(0);
      expect(percent).toBeLessThanOrEqual(100);
    });
  });

  it.each([
    [0, 0, 0],
    [0, 3, 0],
    [3, 3, 100],
    [1, 3, 33],
    [2, 3, 67],
  ])('returns %i of %i done as %i percent', (done, total, expected) => {
    // Act
    const percent = completionPercent(done, total);

    // Assert
    expect(percent).toBe(expected);
  });
});

describe('nonBlank', () => {
  it('keeps a string that has visible characters', () => {
    // Arrange
    const value = ` ${faker.lorem.words()} `;

    // Act
    const result = nonBlank(value);

    // Assert
    expect(result).toBe(value);
  });

  it.each([undefined, '', '   ', '\n\t'])('treats %j as not streamed yet', (value) => {
    // Act
    const result = nonBlank(value);

    // Assert
    expect(result).toBeUndefined();
  });
});
