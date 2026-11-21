import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';

import { GUEST_HOURLY_GENERATIONS, USER_HOURLY_GENERATIONS } from '../constants';
import {
  TOO_MANY_REQUESTS_ERROR,
  hourlyGenerationsFor,
  minutesUntil,
  parseRateLimitBody,
  retryAfterSeconds,
} from './rateLimit';

const RANDOM_RUNS = 50;
const HOUR_MS = 60 * 60 * 1000;

const pickNow = (): number => faker.date.recent().getTime();

describe('hourlyGenerationsFor', () => {
  it('gives guests the guest allowance and signed-in users the larger one', () => {
    // Act
    const guest = hourlyGenerationsFor(false);
    const user = hourlyGenerationsFor(true);

    // Assert
    expect(guest).toBe(GUEST_HOURLY_GENERATIONS);
    expect(user).toBe(USER_HOURLY_GENERATIONS);
    expect(user).toBeGreaterThan(guest);
  });
});

describe('retryAfterSeconds', () => {
  it('never lets the client retry before the reset, for random waits within the hour', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const now = pickNow();
      const resetAt = now + faker.number.int({ min: 1, max: HOUR_MS });

      // Act
      const seconds = retryAfterSeconds(resetAt, now);

      // Assert
      expect(Number.isInteger(seconds)).toBe(true);
      expect(now + seconds * 1000).toBeGreaterThanOrEqual(resetAt);
      expect(now + (seconds - 1) * 1000).toBeLessThan(resetAt);
    });
  });

  it('asks for at least one second when the reset is now or already past', () => {
    // Arrange
    const now = pickNow();

    // Act
    const atReset = retryAfterSeconds(now, now);
    const pastReset = retryAfterSeconds(now - faker.number.int({ min: 1, max: HOUR_MS }), now);

    // Assert
    expect(atReset).toBe(1);
    expect(pastReset).toBe(1);
  });
});

describe('minutesUntil', () => {
  it('rounds up to whole minutes, for random waits within the hour', () => {
    Array.from({ length: RANDOM_RUNS }).forEach(() => {
      // Arrange
      const now = pickNow();
      const resetAt = now + faker.number.int({ min: 1, max: HOUR_MS });

      // Act
      const minutes = minutesUntil(resetAt, now);

      // Assert
      expect(now + minutes * 60_000).toBeGreaterThanOrEqual(resetAt);
      expect(now + (minutes - 1) * 60_000).toBeLessThan(resetAt);
    });
  });

  it('says one minute at a boundary: 1 ms, exactly 60 s, and a reset already past', () => {
    // Arrange
    const now = pickNow();

    // Act
    const oneMs = minutesUntil(now + 1, now);
    const exactlyOneMinute = minutesUntil(now + 60_000, now);
    const past = minutesUntil(now - 1, now);

    // Assert
    expect(oneMs).toBe(1);
    expect(exactlyOneMinute).toBe(1);
    expect(past).toBe(1);
  });
});

describe('parseRateLimitBody', () => {
  const buildBody = () => ({
    error: TOO_MANY_REQUESTS_ERROR,
    limit: faker.number.int({ min: 1, max: 50 }),
    reset: pickNow(),
  });

  it('reads the limit and reset time from a 429 body', () => {
    // Arrange
    const body = buildBody();

    // Act
    const parsed = parseRateLimitBody(JSON.stringify(body));

    // Assert
    expect(parsed).toEqual(body);
  });

  it('returns null for other failures: another error, a missing field, plain text, empty', () => {
    // Arrange
    const { reset, ...withoutReset } = buildBody();
    const texts = [
      JSON.stringify({ ...buildBody(), error: 'Prompt too long' }),
      JSON.stringify(withoutReset),
      JSON.stringify({ ...buildBody(), reset: String(reset) }),
      faker.lorem.sentence(),
      '',
    ];

    // Act
    const parsed = texts.map(parseRateLimitBody);

    // Assert
    expect(parsed).toEqual(texts.map(() => null));
  });
});
