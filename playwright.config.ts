import { defineConfig, devices } from '@playwright/test';

import { loadE2eEnv } from './e2e/support/e2eEnv';

// Not 3000, so the tests never attach to a dev server that happens to be running.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_START_TIMEOUT_MS = 180_000;

const DATABASE_URL = loadE2eEnv();

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global.setup.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // A production build: hydration timing in `next dev` makes early clicks flaky.
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: BASE_URL,
    // Never reuse: a server started some other way may point at another database.
    reuseExistingServer: false,
    timeout: SERVER_START_TIMEOUT_MS,
    stdout: 'ignore',
    stderr: 'pipe',
    // The process env beats `.env*` files in Next.js, so the app under test uses the dev branch.
    env: { DATABASE_URL },
  },
});
