import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { GUEST_PROMPT_LIMIT, USER_PROMPT_LIMIT } from '../constants';
import {
  COUNTER_VISIBLE_RATIO,
  NEAR_LIMIT_RATIO,
  type PromptLengthTone,
  isPromptOverLimit,
  promptLengthTone,
  promptLimitFor,
} from './promptLimit';

const RANDOM_RUNS = 50;
const TONE_ORDER: readonly PromptLengthTone[] = ['hidden', 'visible', 'near', 'over'];

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

describe('promptLengthTone', () => {
  it('is "over" exactly when the prompt is over the limit, for random limits and lengths', () => {
    // Arrange
    const cases = Array.from({ length: RANDOM_RUNS }, () => {
      const limit = faker.number.int({ min: 1, max: USER_PROMPT_LIMIT });
      return { limit, length: faker.number.int({ min: 0, max: limit * 2 }) };
    });

    // Act
    const tones = cases.map(({ length, limit }) => promptLengthTone(length, limit));

    // Assert
    tones.forEach((tone, index) => {
      const { length, limit } = cases[index];
      expect(tone === 'over').toBe(isPromptOverLimit('a'.repeat(length), limit));
    });
  });

  it('never steps back as the prompt grows, for random limits', () => {
    // Arrange
    const limits = Array.from({ length: RANDOM_RUNS }, () =>
      faker.number.int({ min: 1, max: USER_PROMPT_LIMIT }),
    );

    // Act
    const ranks = limits.map((limit) =>
      Array.from({ length: limit + 2 }, (_, length) =>
        TONE_ORDER.indexOf(promptLengthTone(length, limit)),
      ),
    );

    // Assert
    ranks.forEach((series) =>
      series.slice(1).forEach((rank, index) => expect(rank).toBeGreaterThanOrEqual(series[index])),
    );
  });

  it.each([
    ['empty', 0, 'hidden'],
    ['just under 80%', GUEST_PROMPT_LIMIT * COUNTER_VISIBLE_RATIO - 1, 'hidden'],
    ['at 80%', GUEST_PROMPT_LIMIT * COUNTER_VISIBLE_RATIO, 'visible'],
    ['just under 95%', GUEST_PROMPT_LIMIT * NEAR_LIMIT_RATIO - 1, 'visible'],
    ['at 95%', GUEST_PROMPT_LIMIT * NEAR_LIMIT_RATIO, 'near'],
    ['at the limit', GUEST_PROMPT_LIMIT, 'near'],
    ['one past the limit', GUEST_PROMPT_LIMIT + 1, 'over'],
  ])('is %s for a guest prompt of that length', (_case, length, expected) => {
    // Act
    const tone = promptLengthTone(length, GUEST_PROMPT_LIMIT);

    // Assert
    expect(tone).toBe(expected);
  });
});
