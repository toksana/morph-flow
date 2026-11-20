import { defineConfig, devices } from '@playwright/test';

// Not 3000, so the tests never attach to a dev server that happens to be running.
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_START_TIMEOUT_MS = 180_000;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // A production build: hydration timing in `next dev` makes early clicks flaky.
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: SERVER_START_TIMEOUT_MS,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
