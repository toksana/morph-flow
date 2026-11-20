import { expect, type Page, test } from '@playwright/test';

import { buildTaskList, buildTasks } from '../src/core/test/factories/taskList.factory';
import { buildHabitStreakCard } from '../src/core/test/factories/habitStreakCard.factory';

import { type MockStreamServer, startMockStreamServer } from './support/mockStreamServer';

const TASK_COUNT = 3;
const FIRST_TASK_INDEX = 0;
const SECOND_TASK_INDEX = 1;

const PROMPT_LABEL = 'What do you want to create?';
const SKELETON_LABEL = 'Generating widget…';
const GENERATE = 'Generate';
const STOP = 'Stop';
const NEW_CARD = 'New';
const PRESETS = 'Or try an example';
const ERROR_TEXT = 'Something went wrong. Please try again.';
const START_HEADING = /Zero-UI task and habit planner/;

let mock: MockStreamServer;

test.beforeEach(async ({ page }) => {
  mock = await startMockStreamServer();
  // The app still posts to /api/generate; the browser is sent on to the mock that streams by hand.
  await page.route('**/api/generate', (route) =>
    route.continue({ url: `${mock.url}/api/generate` }),
  );
});

test.afterEach(async () => {
  await mock.close();
});

const sendPrompt = async (page: Page, prompt: string): Promise<void> => {
  await page.getByLabel(PROMPT_LABEL).fill(prompt);
  await page.getByRole('button', { name: GENERATE }).click();
};

const openStartScreen = async (page: Page): Promise<void> => {
  await page.goto('/');
  // Clicking before hydration would submit a plain form, so wait until the app is interactive.
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: START_HEADING })).toBeVisible();
};

test('streams a card in pieces, finishes it, and drops it on New mid-stream', async ({ page }) => {
  const taskList = buildTaskList({ tasks: buildTasks(TASK_COUNT) });
  const json = JSON.stringify({ widget: taskList });
  const secondTaskStart = json.indexOf(JSON.stringify(taskList.tasks[SECOND_TASK_INDEX]));
  const prompt = 'plan my day';

  await test.step('send a prompt: the request carries the text and the time zone', async () => {
    await openStartScreen(page);
    await sendPrompt(page, prompt);

    const first = await mock.nextStream();
    expect(first.body).toEqual({
      prompt,
      timeZone: await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    });
    await expect(page.getByLabel(SKELETON_LABEL)).toBeVisible();
    await expect(page.getByRole('button', { name: STOP })).toBeVisible();

    await test.step('first chunk: only the first task is on the card', async () => {
      first.push(json.slice(0, secondTaskStart));

      await expect(page.getByText(taskList.tasks[FIRST_TASK_INDEX].title)).toBeVisible();
      await expect(page.getByText(taskList.tasks[SECOND_TASK_INDEX].title)).toHaveCount(0);
      await expect(page.getByRole('button', { name: STOP })).toBeVisible();
    });

    await test.step('rest of the stream: every task appears and Generate returns', async () => {
      first.push(json.slice(secondTaskStart));
      first.end();

      await expect(page.getByRole('checkbox')).toHaveCount(TASK_COUNT);
      await expect(page.getByRole('button', { name: GENERATE })).toBeVisible();
      await expect(page.getByText(ERROR_TEXT)).toHaveCount(0);
    });
  });

  await test.step('New during a second stream: the card goes and the request is cut', async () => {
    const card = buildHabitStreakCard();
    const cardJson = JSON.stringify({ widget: card });
    const streamsDaysAt = cardJson.indexOf('"streakDays"');

    await sendPrompt(page, 'a reading habit');
    const second = await mock.nextStream();
    second.push(cardJson.slice(0, streamsDaysAt));
    await expect(page.getByText(card.title)).toBeVisible();

    await page.getByRole('button', { name: NEW_CARD }).click();

    await expect(page.getByRole('heading', { name: START_HEADING })).toBeVisible();
    await expect(page.getByRole('group', { name: PRESETS })).toBeVisible();
    await expect.poll(() => second.isClosedByClient()).toBe(true);
    // Late data on a dead request must not bring the card back.
    second.push(cardJson.slice(streamsDaysAt));
    second.end();
    await expect(page.getByText(card.title)).toHaveCount(0);
    await expect(page.getByRole('button', { name: NEW_CARD })).toHaveCount(0);
  });
});
