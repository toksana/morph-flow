import { clerkSetup } from '@clerk/testing/playwright';

import { HABITS_TEST_USER_EMAIL, ensureTestUser } from './support/testUser';

/**
 * Runs once in the main process, so the testing token `clerkSetup` puts in the environment
 * reaches every worker. The token lets the browser past Clerk's bot checks.
 */
const globalSetup = async (): Promise<void> => {
  // Keys come from loadE2eEnv (playwright.config.ts); its own dotenv would load all of .env.local.
  await clerkSetup({ dotenv: false });
  await Promise.all([ensureTestUser(), ensureTestUser(HABITS_TEST_USER_EMAIL)]);
};

export default globalSetup;
