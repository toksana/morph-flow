import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { USER_PROMPT_LIMIT } from '../constants';
import { generateRequestSchema } from './generate.request';

const RANDOM_RUNS = 50;
const TIME_ZONES = ['UTC', 'Europe/Berlin', 'America/New_York', 'Asia/Tokyo'];

const buildRequest = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  prompt: faker.lorem.sentence(),
  timeZone: faker.helpers.arrayElement(TIME_ZONES),
  ...overrides,
});

describe('generateRequestSchema', () => {
  it('accepts random prompts within the user limit', () => {
    // Arrange
    const requests = Array.from({ length: RANDOM_RUNS }, () =>
      buildRequest({ prompt: faker.string.alpha({ length: { min: 1, max: USER_PROMPT_LIMIT } }) }),
    );

    // Act
    const results = requests.map((request) => generateRequestSchema.safeParse(request));

    // Assert
    results.forEach((result) => expect(result.success).toBe(true));
  });

  it('trims surrounding whitespace from the prompt', () => {
    // Arrange
    const request = buildRequest();

    // Act
    const result = generateRequestSchema.parse({ ...request, prompt: `  ${request.prompt}\n` });

    // Assert
    expect(result).toEqual(request);
  });

  it.each([
    ['missing prompt', { prompt: undefined }],
    ['empty prompt', { prompt: '' }],
    ['whitespace-only prompt', { prompt: '   \n' }],
    ['non-string prompt', { prompt: 42 }],
    ['missing time zone', { timeZone: undefined }],
    ['unknown time zone', { timeZone: 'Mars/Olympus' }],
    ['overlong time zone', { timeZone: `Europe/${'a'.repeat(64)}` }],
  ])('rejects a %s', (_case, overrides) => {
    // Act
    const result = generateRequestSchema.safeParse(buildRequest(overrides));

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects a non-object body', () => {
    // Act
    const result = generateRequestSchema.safeParse('plan my day');

    // Assert
    expect(result.success).toBe(false);
  });

  it('leaves prompts past every limit to the server check, which answers 413', () => {
    // Act
    const result = generateRequestSchema.safeParse(
      buildRequest({ prompt: 'a'.repeat(USER_PROMPT_LIMIT + 1) }),
    );

    // Assert
    expect(result.success).toBe(true);
  });
});
