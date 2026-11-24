import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { localDay } from '@/core/widgets/promptDate';

import { buildClerkUserId } from '../test/dbUsers';
import { buildHabitsWithCheckIns } from '../test/habitRows';
import { type LoadSavedHabitsDeps, createLoadSavedHabits } from './loadSavedHabits';
import { toSavedHabitView } from './savedHabitView';

const MAX_HABITS = 10;
const TIME_ZONES = ['UTC', 'Asia/Tokyo', 'America/Los_Angeles'] as const;

const signedIn = (overrides: Partial<LoadSavedHabitsDeps> = {}) => {
  const clerkUserId = buildClerkUserId();
  const user = { id: faker.string.uuid(), timeZone: faker.helpers.arrayElement(TIME_ZONES) };
  const now = faker.date.recent();
  const rows = buildHabitsWithCheckIns(faker.number.int({ min: 1, max: MAX_HABITS }));
  const deps = {
    identify: vi.fn(async () => clerkUserId),
    findUser: vi.fn(async () => user),
    listHabits: vi.fn(async () => rows),
    now: () => now,
    ...overrides,
  };
  return { clerkUserId, user, now, rows, deps };
};

describe('createLoadSavedHabits', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the user's habits as views for their today, in the order they were listed", async () => {
    // Arrange
    const { clerkUserId, user, now, rows, deps } = signedIn();
    const today = localDay(now, user.timeZone);

    // Act
    const habits = await createLoadSavedHabits(deps)();

    // Assert
    expect(habits).toEqual(rows.map((row) => toSavedHabitView(row, today)));
    expect(deps.findUser).toHaveBeenCalledWith(clerkUserId);
    expect(deps.listHabits).toHaveBeenCalledWith(user.id);
  });

  it("uses the user's zone for today: 22:30 UTC is already the next day in Tokyo", async () => {
    // Arrange
    const [row] = buildHabitsWithCheckIns(1);
    const habit = { ...row, startDay: '2026-11-20', checkInDays: ['2026-11-25'] };
    const { deps } = signedIn({
      findUser: async () => ({ id: faker.string.uuid(), timeZone: 'Asia/Tokyo' }),
      listHabits: async () => [habit],
      now: () => new Date('2026-11-24T22:30:00Z'),
    });

    // Act
    const habits = await createLoadSavedHabits(deps)();

    // Assert
    expect(habits?.[0].doneToday).toBe(true);
  });

  it('returns null for a guest without touching the database', async () => {
    // Arrange
    const { deps } = signedIn({ identify: async () => null });

    // Act
    const habits = await createLoadSavedHabits(deps)();

    // Assert
    expect(habits).toBeNull();
    expect(deps.findUser).not.toHaveBeenCalled();
    expect(deps.listHabits).not.toHaveBeenCalled();
  });

  it('returns null for a user who has no row yet', async () => {
    // Arrange
    const { deps } = signedIn({ findUser: async () => null });

    // Act
    const habits = await createLoadSavedHabits(deps)();

    // Assert
    expect(habits).toBeNull();
    expect(deps.listHabits).not.toHaveBeenCalled();
  });

  it('logs a failed read and returns null instead of throwing', async () => {
    // Arrange
    const message = faker.lorem.sentence();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { deps } = signedIn({
      listHabits: async () => {
        throw new Error(message);
      },
    });

    // Act
    const habits = await createLoadSavedHabits(deps)();

    // Assert
    expect(habits).toBeNull();
    expect(consoleError).toHaveBeenCalledWith('[habits] loading saved habits failed:', message);
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
    const result = createLoadSavedHabits(deps)();

    // Assert
    await expect(result).rejects.toBe(signal);
  });
});
