import { z } from 'zod';

const CLERK_API_URL = 'https://api.clerk.com/v1';
/** Clerk treats `+clerk_test` addresses as test emails: nobody receives mail for them. */
const DEFAULT_TEST_USER_EMAIL = 'e2e+clerk_test@example.com';

export const TEST_USER_EMAIL = process.env.E2E_CLERK_USER_EMAIL ?? DEFAULT_TEST_USER_EMAIL;
/**
 * A second user for the habits spec: spec files run in parallel, and on a shared user one spec's
 * seeding would show up in the other's start screen. The `+habits` tag keeps the test address.
 */
export const HABITS_TEST_USER_EMAIL = TEST_USER_EMAIL.replace('@', '+habits@');

const userSchema = z.object({ id: z.string() });

const clerkApi = async (path: string, init: RequestInit = {}): Promise<unknown> => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey === undefined) throw new Error('e2e needs CLERK_SECRET_KEY (see .env.example)');
  const response = await fetch(`${CLERK_API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Clerk ${path} answered ${response.status}`);
  return response.json();
};

const findTestUser = async (email: string): Promise<string | null> => {
  const query = new URLSearchParams({ email_address: email });
  const [user] = z.array(userSchema).parse(await clerkApi(`/users?${query}`));
  return user?.id ?? null;
};

const createTestUser = async (email: string): Promise<string> =>
  userSchema.parse(
    await clerkApi('/users', {
      method: 'POST',
      body: JSON.stringify({ email_address: [email], skip_password_requirement: true }),
    }),
  ).id;

/**
 * The Clerk id of an e2e user (the default one unless `email` is given), created on the first run and reused after that. It has no
 * password or MFA: tests sign in with a server-side token (`clerk.signIn({ emailAddress })`).
 */
export const ensureTestUser = async (email = TEST_USER_EMAIL): Promise<string> =>
  (await findTestUser(email)) ?? createTestUser(email);
