import { faker } from '@faker-js/faker';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildHabitStreakCard } from '@/core/test/factories/habitStreakCard.factory';
import { buildTaskList } from '@/core/test/factories/taskList.factory';
import { localDay } from '@/core/widgets/promptDate';
import type { Widget } from '@/core/widgets/widget.schema';
import { toGeneratedHabit } from '@/server/db/habitValues';
import { generatedTaskValues } from '@/server/db/taskValues';

import { createSaveGeneratedCard } from './saveGeneratedCard';

const TIME_ZONES = ['UTC', 'Asia/Tokyo', 'America/Los_Angeles', 'Pacific/Kiritimati'] as const;

const buildCard = (widget: Widget) => ({
  userId: faker.string.uuid(),
  widget,
  now: faker.date.recent(),
  timeZone: faker.helpers.arrayElement(TIME_ZONES),
});

const buildStores = () => ({
  saveTasks: vi.fn(async () => undefined),
  saveHabit: vi.fn(async () => undefined),
});

describe('createSaveGeneratedCard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves a TaskList's tasks, in order, and no habit", async () => {
    // Arrange
    const stores = buildStores();
    const card = buildCard(buildTaskList());

    // Act
    await createSaveGeneratedCard(stores)(card);

    // Assert
    expect(stores.saveTasks).toHaveBeenCalledExactlyOnceWith(
      card.userId,
      generatedTaskValues(card.widget, card.now),
    );
    expect(stores.saveHabit).not.toHaveBeenCalled();
  });

  it("saves a HabitStreakCard's habit starting on the user's local day, and no tasks", async () => {
    // Arrange
    const stores = buildStores();
    const widget = buildHabitStreakCard();
    const card = buildCard(widget);

    // Act
    await createSaveGeneratedCard(stores)(card);

    // Assert
    expect(stores.saveHabit).toHaveBeenCalledExactlyOnceWith(
      card.userId,
      toGeneratedHabit(widget, localDay(card.now, card.timeZone)),
    );
    expect(stores.saveTasks).not.toHaveBeenCalled();
  });

  it('dates the habit by the time zone, not the server clock: late UTC is tomorrow in Tokyo', async () => {
    // Arrange
    const stores = buildStores();
    const card = {
      ...buildCard(buildHabitStreakCard({ completedToday: true })),
      now: new Date('2026-11-24T22:30:00Z'),
      timeZone: 'Asia/Tokyo',
    };

    // Act
    await createSaveGeneratedCard(stores)(card);

    // Assert
    expect(stores.saveHabit).toHaveBeenCalledWith(
      card.userId,
      expect.objectContaining({
        checkInDay: '2026-11-25',
        values: expect.objectContaining({ startDay: '2026-11-25' }),
      }),
    );
  });

  it('works without stores: nothing to call, nothing thrown', async () => {
    // Act
    const result = createSaveGeneratedCard({})(buildCard(buildHabitStreakCard()));

    // Assert
    await expect(result).resolves.toBeUndefined();
  });

  it('logs a failed save instead of throwing', async () => {
    // Arrange
    const message = faker.lorem.sentence();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const save = createSaveGeneratedCard({
      saveHabit: async () => {
        throw new Error(message);
      },
    });

    // Act
    await save(buildCard(buildHabitStreakCard()));

    // Assert
    expect(consoleError).toHaveBeenCalledWith('[generate] saving the card failed:', message);
  });
});
