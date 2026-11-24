import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { localDay } from '@/core/widgets/promptDate';

import { buildClerkUserId } from '../test/dbUsers';
import { type CheckInHabitDeps, createCheckInHabit } from './checkInHabit';

const TIME_ZONES = ['UTC', 'Asia/Tokyo', 'America/Los_Angeles'] as const;

const buildRequest = () => ({ habitId: faker.string.uuid(), done: faker.datatype.boolean() });

const signedIn = (overrides: Partial<CheckInHabitDeps> = {}) => {
  const clerkUserId = buildClerkUserId();
  const user = { id: faker.string.uuid(), timeZone: faker.helpers.arrayElement(TIME_ZONES) };
  const now = faker.date.recent();
  const deps = {
    identify: vi.fn(async () => clerkUserId),
    findUser: vi.fn(async () => user),
    setHabitCheckIn: vi.fn(async () => true),
    now: () => now,
    ...overrides,
  };
  return { clerkUserId, user, now, deps };
};

describe('createCheckInHabit', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("checks the owner's habit in or out on their today", async () => {
    // Arrange
    const { clerkUserId, user, now, deps } = signedIn();
    const request = buildRequest();

    // Act
    const result = await createCheckInHabit(deps)(request);

    // Assert
    expect(result).toEqual({ ok: true });
    expect(deps.findUser).toHaveBeenCalledWith(clerkUserId);
    expect(deps.setHabitCheckIn).toHaveBeenCalledWith(
      user.id,
      request.habitId,
      localDay(now, user.timeZone),
      request.done,
    );
  });

  it("uses the user's zone for today: 22:30 UTC is already the next day in Tokyo", async () => {
    // Arrange
    const { deps } = signedIn({
      findUser: async () => ({ id: faker.string.uuid(), timeZone: 'Asia/Tokyo' }),
      now: () => new Date('2026-11-24T22:30:00Z'),
    });

    // Act
    await createCheckInHabit(deps)(buildRequest());

    // Assert
    expect(deps.setHabitCheckIn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      '2026-11-25',
      expect.any(Boolean),
    );
  });

  it.each([
    [undefined],
    [{ habitId: 'habit-0', done: true }],
    [{ habitId: faker.string.uuid() }],
    [{ habitId: faker.string.uuid(), done: 'yes' }],
  ])('rejects %j without asking who the caller is', async (input) => {
    // Arrange
    const { deps } = signedIn();

    // Act
    const result = await createCheckInHabit(deps)(input);

    // Assert
    expect(result).toEqual({ ok: false, error: 'invalid' });
    expect(deps.identify).not.toHaveBeenCalled();
    expect(deps.setHabitCheckIn).not.toHaveBeenCalled();
  });

  it('refuses a guest without touching the database', async () => {
    // Arrange
    const { deps } = signedIn({ identify: async () => null });

    // Act
    const result = await createCheckInHabit(deps)(buildRequest());

    // Assert
    expect(result).toEqual({ ok: false, error: 'unauthorized' });
    expect(deps.findUser).not.toHaveBeenCalled();
    expect(deps.setHabitCheckIn).not.toHaveBeenCalled();
  });

  it('reports not_found for a user with no row yet', async () => {
    // Arrange
    const { deps } = signedIn({ findUser: async () => null });

    // Act
    const result = await createCheckInHabit(deps)(buildRequest());

    // Assert
    expect(result).toEqual({ ok: false, error: 'not_found' });
    expect(deps.setHabitCheckIn).not.toHaveBeenCalled();
  });

  it("reports not_found for a habit that is not the caller's live habit", async () => {
    // Arrange
    const { deps } = signedIn({ setHabitCheckIn: async () => false });

    // Act
    const result = await createCheckInHabit(deps)(buildRequest());

    // Assert
    expect(result).toEqual({ ok: false, error: 'not_found' });
  });

  it('logs a database failure and reports it instead of throwing', async () => {
    // Arrange
    const message = faker.lorem.sentence();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { deps } = signedIn({
      setHabitCheckIn: async () => {
        throw new Error(message);
      },
    });

    // Act
    const result = await createCheckInHabit(deps)(buildRequest());

    // Assert
    expect(result).toEqual({ ok: false, error: 'failed' });
    expect(consoleError).toHaveBeenCalledWith('[habits] checking in a habit failed:', message);
  });

  it('lets a failed session read through, so Next.js can defer the read to request time', async () => {
    // Arrange
    const signal = new Error(faker.lorem.sentence());
    const { deps } = signedIn({
      identify: async () => {
        throw signal;
      },
    });

    // Act
    const result = createCheckInHabit(deps)(buildRequest());

    // Assert
    await expect(result).rejects.toBe(signal);
  });
});
