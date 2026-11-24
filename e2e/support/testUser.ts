import { z } from 'zod';

const CLERK_API_URL = 'https://api.clerk.com/v1';
/** Clerk treats `+clerk_test` addresses as test emails: nobody receives mail for them. */
const DEFAULT_TEST_USER_EMAIL = 'e2e+clerk_test@example.com';

export const TEST_USER_EMAIL = process.env.E2E_CLERK_USER_EMAIL ?? DEFAULT_TEST_USER_EMAIL;

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

const findTestUser = async (): Promise<string | null> => {
  const query = new URLSearchParams({ email_address: TEST_USER_EMAIL });
  const [user] = z.array(userSchema).parse(await clerkApi(`/users?${query}`));
  return user?.id ?? null;
};

const createTestUser = async (): Promise<string> =>
  userSchema.parse(
    await clerkApi('/users', {
      method: 'POST',
      body: JSON.stringify({ email_address: [TEST_USER_EMAIL], skip_password_requirement: true }),
    }),
  ).id;

/**
 * The Clerk id of the e2e user, created on the first run and reused after that. It has no
 * password or MFA: tests sign in with a server-side token (`clerk.signIn({ emailAddress })`).
 */
export const ensureTestUser = async (): Promise<string> =>
  (await findTestUser()) ?? createTestUser();
