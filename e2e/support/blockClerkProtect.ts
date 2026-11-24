import type { Page } from '@playwright/test';

/** Clerk Protect's bot-detection script and the probes it sends to several ports. */
const CLERK_PROTECT_URL = '**/*.protect.clerk.com/**';

/**
 * Aborts Clerk Protect requests. Its probes stay open, so `networkidle` (the tests' "the app has
 * hydrated" signal) would never fire. Tests don't need bot detection, and this way they don't
 * depend on whether Protect is switched on in the Clerk dashboard.
 */
export const blockClerkProtect = async (page: Page): Promise<void> => {
  await page.route(CLERK_PROTECT_URL, (route) => route.abort());
};
