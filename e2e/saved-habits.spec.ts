import { clerk } from '@clerk/testing/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { buildHabitStreakCard } from '../src/core/test/factories/habitStreakCard.factory';
import { buildTasks } from '../src/core/test/factories/taskList.factory';
import type { HabitStreakCard } from '../src/core/widgets/habitStreakCard.schema';
import type { Task } from '../src/core/widgets/taskList.schema';

import { blockClerkProtect } from './support/blockClerkProtect';
import { deleteSavedHabits, seedSavedHabits } from './support/savedHabitsDb';
import { deleteSavedTasks, seedSavedTasks } from './support/savedTasksDb';
import { HABITS_TEST_USER_EMAIL, ensureTestUser } from './support/testUser';

const TASKS_TITLE = 'Your tasks';
const HABITS_TITLE = 'Daily streaks';
const PRESETS = 'Or try an example';

const PHONE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
/** The column a lone card keeps (max-w-xl), in px. */
const COLUMN_WIDTH = 576;
const HABIT_COUNT = 3;
const TASK_COUNT = 3;

// One Clerk user of its own (see HABITS_TEST_USER_EMAIL); its tests replace each other's data.
test.describe.configure({ mode: 'serial' });

let clerkUserId: string;
let userId: string | undefined;

test.beforeAll(async () => {
  clerkUserId = await ensureTestUser(HABITS_TEST_USER_EMAIL);
});

test.afterAll(async () => {
  if (userId === undefined) return;
  await Promise.all([deleteSavedTasks(userId), deleteSavedHabits(userId)]);
});

/** Habits not done today, with distinct streaks, so each badge can be found by its number. */
const openHabits = (count: number): HabitStreakCard[] =>
  Array.from({ length: count }, (_, index) =>
    buildHabitStreakCard({ completedToday: false, streakDays: (index + 1) * 4 }),
  );

const openTasks = (count: number): Task[] =>
  buildTasks(count).map((task) => ({ ...task, done: false }));

const seed = async ({ tasks, habits }: { tasks: Task[]; habits: HabitStreakCard[] }) => {
  userId = await seedSavedTasks(clerkUserId, tasks);
  await seedSavedHabits(clerkUserId, habits);
};

const openSignedIn = async (page: Page): Promise<void> => {
  await blockClerkProtect(page);
  await page.goto('/');
  await clerk.signIn({ page, emailAddress: HABITS_TEST_USER_EMAIL });
  await reloadStartScreen(page);
};

const reloadStartScreen = async (page: Page): Promise<void> => {
  await page.reload();
  // Clicking before hydration would do nothing, so wait until the app is interactive.
  await page.waitForLoadState('networkidle');
};

const cardWith = (page: Page, title: string): Locator =>
  page.locator('[data-slot="card"]', { hasText: title });

const checkInButton = (card: Locator, habit: HabitStreakCard): Locator =>
  card.getByRole('button', { name: `Check in: ${habit.title}` });

const streakBadge = (card: Locator, days: number): Locator => card.getByLabel(`${days}-day streak`);

const box = async (locator: Locator) => {
  const bounds = await locator.boundingBox();
  if (bounds === null) throw new Error('the card is not rendered');
  return bounds;
};

/** Taps the check-in and waits until the Server Action has saved it. */
const tapAndSave = async (page: Page, button: Locator): Promise<void> => {
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && 'next-action' in response.request().headers(),
  );
  await button.click();
  await saved;
};

test('shows Habits right under Your tasks on a phone and beside it on a desktop', async ({
  page,
}) => {
  await seed({ tasks: openTasks(TASK_COUNT), habits: openHabits(HABIT_COUNT) });

  await page.setViewportSize(DESKTOP_VIEWPORT);
  await openSignedIn(page);
  const tasksCard = cardWith(page, TASKS_TITLE);
  const habitsCard = cardWith(page, HABITS_TITLE);

  await test.step('desktop: one row, tasks on the left, wider than the lone-card column', async () => {
    const [tasks, habits] = [await box(tasksCard), await box(habitsCard)];
    expect(habits.y).toBe(tasks.y);
    expect(habits.x).toBeGreaterThan(tasks.x + tasks.width);
    expect(habits.x + habits.width - tasks.x).toBeGreaterThan(COLUMN_WIDTH);
    await expect(habitsCard.getByText(`0/${HABIT_COUNT}`)).toBeVisible();
  });

  await test.step('phone: stacked, habits below tasks', async () => {
    await page.setViewportSize(PHONE_VIEWPORT);
    const [tasks, habits] = [await box(tasksCard), await box(habitsCard)];
    expect(habits.x).toBe(tasks.x);
    expect(habits.y).toBeGreaterThanOrEqual(tasks.y + tasks.height);
  });
});

test('checks a habit in at once, keeps it after a reload, and saves the undo too', async ({
  page,
}) => {
  const habits = openHabits(HABIT_COUNT);
  const [target] = habits;
  await seed({ tasks: [], habits });

  await openSignedIn(page);
  const card = cardWith(page, HABITS_TITLE);
  const button = checkInButton(card, target);

  await test.step('a tap fills the button, adds today to the streak and the counter', async () => {
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await tapAndSave(page, button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(streakBadge(card, target.streakDays + 1)).toBeVisible();
    await expect(card.getByText(`1/${HABIT_COUNT}`)).toBeVisible();
  });

  await test.step('after a reload the check-in is still there', async () => {
    await reloadStartScreen(page);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(streakBadge(card, target.streakDays + 1)).toBeVisible();
  });

  await test.step('undoing is saved too', async () => {
    await tapAndSave(page, button);
    await reloadStartScreen(page);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(streakBadge(card, target.streakDays)).toBeVisible();
    await expect(card.getByText(`0/${HABIT_COUNT}`)).toBeVisible();
  });
});

test('leaves an empty card out: habits alone take the column, nothing saved shows the examples', async ({
  page,
}) => {
  await seed({ tasks: [], habits: openHabits(1) });

  await page.setViewportSize(DESKTOP_VIEWPORT);
  await openSignedIn(page);

  await test.step('no tasks: no tasks card, the habits card in the reading column', async () => {
    await expect(cardWith(page, HABITS_TITLE)).toBeVisible();
    await expect(page.getByText(TASKS_TITLE)).toHaveCount(0);
    expect((await box(cardWith(page, HABITS_TITLE))).width).toBeLessThanOrEqual(COLUMN_WIDTH);
  });

  await test.step('no tasks and no habits: the examples', async () => {
    await seed({ tasks: [], habits: [] });
    await reloadStartScreen(page);
    await expect(page.getByRole('group', { name: PRESETS })).toBeVisible();
    await expect(page.locator('[data-slot="card"]')).toHaveCount(0);
  });
});
