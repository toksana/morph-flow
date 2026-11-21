import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { GUEST_PROMPT_LIMIT, USER_PROMPT_LIMIT } from '../constants';
import { isPromptOverLimit, promptLimitFor } from './promptLimit';

const RANDOM_RUNS = 50;

describe('promptLimitFor', () => {
  it('gives guests the guest limit and signed-in users the larger user limit', () => {
    // Act
    const guestLimit = promptLimitFor(false);
    const userLimit = promptLimitFor(true);

    // Assert
    expect(guestLimit).toBe(GUEST_PROMPT_LIMIT);
    expect(userLimit).toBe(USER_PROMPT_LIMIT);
    expect(userLimit).toBeGreaterThan(guestLimit);
  });
});

describe('isPromptOverLimit', () => {
  it('flags exactly the prompts longer than the limit, for random limits and lengths', () => {
    // Arrange
    const cases = Array.from({ length: RANDOM_RUNS }, () => {
      const limit = faker.number.int({ min: 1, max: USER_PROMPT_LIMIT });
      const length = faker.number.int({ min: 0, max: limit * 2 });
      return { limit, prompt: 'a'.repeat(length) };
    });

    // Act
    const results = cases.map(({ prompt, limit }) => isPromptOverLimit(prompt, limit));

    // Assert
    results.forEach((result, index) => {
      const { prompt, limit } = cases[index];
      expect(result).toBe(prompt.length > limit);
    });
  });

  it.each([
    ['empty', 0, false],
    ['at the limit', GUEST_PROMPT_LIMIT, false],
    ['one past the limit', GUEST_PROMPT_LIMIT + 1, true],
  ])('treats an %s prompt correctly', (_case, length, expected) => {
    // Act
    const result = isPromptOverLimit('a'.repeat(length), GUEST_PROMPT_LIMIT);

    // Assert
    expect(result).toBe(expected);
  });
});
