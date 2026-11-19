import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { MAX_PROMPT_LENGTH, taskListRequestSchema } from './taskList.request';

const RANDOM_RUNS = 50;
const TIME_ZONES = ['UTC', 'Europe/Berlin', 'America/New_York', 'Asia/Tokyo'];

const buildRequest = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  prompt: faker.lorem.sentence(),
  timeZone: faker.helpers.arrayElement(TIME_ZONES),
  ...overrides,
});

describe('taskListRequestSchema', () => {
  it('accepts random prompts within the length limit', () => {
    // Arrange
    const requests = Array.from({ length: RANDOM_RUNS }, () =>
      buildRequest({ prompt: faker.string.alpha({ length: { min: 1, max: MAX_PROMPT_LENGTH } }) }),
    );

    // Act
    const results = requests.map((request) => taskListRequestSchema.safeParse(request));

    // Assert
    results.forEach((result) => expect(result.success).toBe(true));
  });

  it('trims surrounding whitespace from the prompt', () => {
    // Arrange
    const request = buildRequest();

    // Act
    const result = taskListRequestSchema.parse({ ...request, prompt: `  ${request.prompt}\n` });

    // Assert
    expect(result).toEqual(request);
  });

  it.each([
    ['missing prompt', { prompt: undefined }],
    ['empty prompt', { prompt: '' }],
    ['whitespace-only prompt', { prompt: '   \n' }],
    ['non-string prompt', { prompt: 42 }],
    ['too long prompt', { prompt: 'a'.repeat(MAX_PROMPT_LENGTH + 1) }],
    ['missing time zone', { timeZone: undefined }],
    ['unknown time zone', { timeZone: 'Mars/Olympus' }],
    ['overlong time zone', { timeZone: `Europe/${'a'.repeat(64)}` }],
  ])('rejects a %s', (_case, overrides) => {
    // Act
    const result = taskListRequestSchema.safeParse(buildRequest(overrides));

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects a non-object body', () => {
    // Act
    const result = taskListRequestSchema.safeParse('plan my day');

    // Assert
    expect(result.success).toBe(false);
  });

  it('accepts a prompt exactly at the length limit', () => {
    // Act
    const result = taskListRequestSchema.safeParse(
      buildRequest({ prompt: 'a'.repeat(MAX_PROMPT_LENGTH) }),
    );

    // Assert
    expect(result.success).toBe(true);
  });
});
