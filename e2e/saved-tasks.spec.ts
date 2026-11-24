import { clerk } from '@clerk/testing/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { buildTasks } from '../src/core/test/factories/taskList.factory';
import type { Task } from '../src/core/widgets/taskList.schema';

import { blockClerkProtect } from './support/blockClerkProtect';
import { deleteSavedHabits } from './support/savedHabitsDb';
import { deleteSavedTasks, seedSavedTasks } from './support/savedTasksDb';
import { TEST_USER_EMAIL, ensureTestUser } from './support/testUser';

const SAVED_TASKS_TITLE = 'Your tasks';
const BRAND = 'Morph Flow';
const PRESETS = 'Or try an example';
const HERO_HEADING = /Zero-UI task and habit planner/;
const SHOW_LESS = 'Show less';
const showAll = (count: number): string => `Show all (${count})`;

const DESKTOP_ROWS = 5;
const PHONE_ROWS = 3;
const PHONE_VIEWPORT = { width: 390, height: 844 };
const OPEN_COUNT = 6;

// One shared Clerk user: the tests replace each other's saved tasks, so they run one by one.
test.describe.configure({ mode: 'serial' });

let clerkUserId: string;
let userId: string | undefined;

test.beforeAll(async () => {
  clerkUserId = await ensureTestUser();
});

test.afterAll(async () => {
  if (userId !== undefined) await deleteSavedTasks(userId);
});

/** Undated and equal in priority, so urgency ties and rows keep the seeded order. */
const tiedTasks = (count: number, done: boolean): Task[] =>
  buildTasks(count).map((task) => ({ ...task, done, due: undefined, priority: 'medium' }));

/** Exactly these tasks and no habits, so only the tasks card can show. */
const seed = async (tasks: Task[]): Promise<void> => {
  userId = await seedSavedTasks(clerkUserId, tasks);
  await deleteSavedHabits(userId);
};

/** Signs in, then loads the start screen again so the Server Component reads the session. */
const openSignedIn = async (page: Page): Promise<Locator> => {
  await blockClerkProtect(page);
  await page.goto('/');
  await clerk.signIn({ page, emailAddress: TEST_USER_EMAIL });
  await reloadStartScreen(page);
  return savedTasksCard(page);
};

const reloadStartScreen = async (page: Page): Promise<void> => {
  await page.reload();
  // Clicking before hydration would do nothing, so wait until the app is interactive.
  await page.waitForLoadState('networkidle');
};

const savedTasksCard = (page: Page): Locator =>
  page.locator('[data-slot="card"]', { hasText: SAVED_TASKS_TITLE });

const visibleRows = (card: Locator): Locator => card.locator('li:visible');

/** Ticks a task and waits until the Server Action has saved it. */
const toggleAndSave = async (page: Page, card: Locator, title: string): Promise<void> => {
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && 'next-action' in response.request().headers(),
  );
  await card.getByRole('checkbox', { name: title }).click();
  await saved;
};

test('a signed-in user gets the navbar brand, the field and their tasks, no pitch', async ({
  page,
}) => {
  await seed(tiedTasks(PHONE_ROWS, false));

  const card = await openSignedIn(page);

  await expect(page.getByRole('banner').getByText(BRAND)).toBeVisible();
  await expect(page.getByRole('heading', { name: HERO_HEADING })).toHaveCount(0);
  await expect(page.getByRole('group', { name: PRESETS })).toHaveCount(0);
  await expect(card).toBeVisible();
  // The card starts on the first screen, right under the field, on a phone too.
  await page.setViewportSize(PHONE_VIEWPORT);
  await expect(card).toBeInViewport();
});

test('a signed-in user with no saved tasks yet gets the examples instead', async ({ page }) => {
  await seed([]);

  await openSignedIn(page);

  await expect(page.getByRole('group', { name: PRESETS })).toBeVisible();
  await expect(page.getByRole('heading', { name: HERO_HEADING })).toHaveCount(0);
  await expect(page.getByText(SAVED_TASKS_TITLE)).toHaveCount(0);
});

test('ticks a saved task at once and keeps it ticked after a reload', async ({ page }) => {
  const tasks = tiedTasks(PHONE_ROWS, false);
  const [target] = tasks;
  await seed(tasks);

  const card = await openSignedIn(page);
  await test.step('the start screen lists every saved open task, unticked', async () => {
    for (const task of tasks) {
      await expect(card.getByRole('checkbox', { name: task.title })).not.toBeChecked();
    }
  });

  await test.step('a tick shows at once and is saved', async () => {
    await toggleAndSave(page, card, target.title);
    await expect(card.getByRole('checkbox', { name: target.title })).toBeChecked();
    await expect(card.getByText(`1/${tasks.length}`)).toBeVisible();
  });

  await test.step('after a reload the task is done: collapsed away, ticked under Show all', async () => {
    await reloadStartScreen(page);
    await expect(visibleRows(card)).toHaveCount(tasks.length - 1);
    await card.getByRole('button', { name: showAll(tasks.length) }).click();
    await expect(card.getByRole('checkbox', { name: target.title })).toBeChecked();
  });

  await test.step('unticking is saved too', async () => {
    await toggleAndSave(page, card, target.title);
    await reloadStartScreen(page);
    await expect(visibleRows(card)).toHaveCount(tasks.length);
    await expect(card.getByRole('checkbox', { name: target.title })).not.toBeChecked();
  });
});

test('collapses to the most urgent open tasks, fewer on a phone, and expands to all', async ({
  page,
}) => {
  const open = tiedTasks(OPEN_COUNT, false);
  const [done] = tiedTasks(1, true);
  const total = open.length + 1;
  await seed([done, ...open]);

  const card = await openSignedIn(page);
  await test.step('desktop: five open tasks and Show all', async () => {
    await expect(visibleRows(card)).toHaveCount(DESKTOP_ROWS);
    await expect(card.getByRole('button', { name: showAll(total) })).toBeVisible();
  });

  await test.step('phone: three open tasks', async () => {
    await page.setViewportSize(PHONE_VIEWPORT);
    await expect(visibleRows(card)).toHaveCount(PHONE_ROWS);
    await expect(card.getByText(open[PHONE_ROWS].title)).toBeHidden();
  });

  await test.step('Show all lists every task with the done one last, Show less folds back', async () => {
    await card.getByRole('button', { name: showAll(total) }).click();
    await expect(visibleRows(card)).toHaveCount(total);
    await expect(visibleRows(card).last()).toContainText(done.title);
    await expect(card.getByRole('checkbox', { name: done.title })).toBeChecked();

    await card.getByRole('button', { name: SHOW_LESS }).click();
    await expect(visibleRows(card)).toHaveCount(PHONE_ROWS);
  });
});
