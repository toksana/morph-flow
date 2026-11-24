import type { LanguageModel } from 'ai';

import { formatPromptDate } from '@/core/widgets/promptDate';
import { generateRequestSchema } from '@/core/widgets/generate.request';
import { isPromptOverLimit, promptLimitFor } from '@/core/widgets/promptLimit';
import {
  TOO_MANY_REQUESTS_ERROR,
  type RateLimitBody,
  retryAfterSeconds,
} from '@/core/widgets/rateLimit';
import type { Widget } from '@/core/widgets/widget.schema';
import { type TaskValues, generatedTaskValues } from '@/server/db/taskValues';
import type { UserIdentity } from '@/server/db/users';
import {
  type CheckRateLimit,
  type RateLimitCaller,
  type RateLimitVerdict,
  clientIp,
} from '@/server/rateLimit/caller';

import { createLogError } from '../logError';
import { streamWidget } from './streamWidget';

const INVALID_REQUEST_STATUS = 400;
const PROMPT_TOO_LONG_STATUS = 413;
const TOO_MANY_REQUESTS_STATUS = 429;

interface GenerateHandlerDeps {
  /** Defaults to the AI Gateway model; tests pass a mock. */
  model?: LanguageModel;
  /** Clock for "today" in the prompt; injected so tests are deterministic. */
  now?: () => Date;
  /** Clerk user id of the caller, or null for a guest. Defaults to treating everyone as a guest. */
  identify?: () => Promise<string | null>;
  /** Stores the signed-in caller's row and returns its `users.id`; skipped for guests. */
  saveUser?: (identity: UserIdentity) => Promise<string>;
  /** Stores a signed-in user's generated tasks, in order; the database hands out their ids. */
  saveTasks?: (userId: string, tasks: readonly TaskValues[]) => Promise<void>;
  /** Counts the request against the caller's hourly allowance. Defaults to no limit. */
  checkRateLimit?: CheckRateLimit;
}

const guest = async (): Promise<null> => null;
const noRateLimit: CheckRateLimit = async () => ({ success: true, limit: 0, reset: 0 });

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return undefined;
    throw error;
  }
};

const logError = createLogError('generate');

const logStreamError = (error: unknown): void => logError('stream failed', error);

/**
 * A database hiccup must not cost the user their card: log it and keep generating.
 * @returns the user's `users.id`, or null if there is no store or it failed (the card is then
 * not saved either)
 */
const saveSignedInUser = async (
  saveUser: GenerateHandlerDeps['saveUser'],
  identity: UserIdentity,
): Promise<string | null> => {
  if (saveUser === undefined) return null;
  try {
    return await saveUser(identity);
  } catch (error) {
    logError('saving the user failed', error);
    return null;
  }
};

/** Saves the finished card's tasks. Runs after the card is on screen, so a failure is only logged. */
const saveGeneratedTasks = async (
  saveTasks: GenerateHandlerDeps['saveTasks'],
  userId: string,
  widget: Widget,
  now: Date,
): Promise<void> => {
  const tasks = generatedTaskValues(widget, now);
  if (saveTasks === undefined || tasks.length === 0) return;
  try {
    await saveTasks(userId, tasks);
  } catch (error) {
    logError('saving the card failed', error);
  }
};

/**
 * The verdict when the caller is over their allowance, otherwise null. If the limiter itself
 * fails (e.g. Redis is down), the request goes through: the site keeps working, and the prompt
 * limit still caps what a single request can cost.
 */
const blockedVerdict = async (
  checkRateLimit: CheckRateLimit,
  caller: RateLimitCaller,
): Promise<RateLimitVerdict | null> => {
  try {
    const verdict = await checkRateLimit(caller);
    return verdict.success ? null : verdict;
  } catch (error) {
    logError('rate limit check failed', error);
    return null;
  }
};

const tooManyRequests = ({ limit, reset }: RateLimitVerdict, now: Date): Response =>
  Response.json({ error: TOO_MANY_REQUESTS_ERROR, limit, reset } satisfies RateLimitBody, {
    status: TOO_MANY_REQUESTS_STATUS,
    headers: { 'Retry-After': String(retryAfterSeconds(reset, now.getTime())) },
  });

/**
 * Builds the POST handler: validate the body, apply the caller's prompt limit and hourly allowance,
 * then stream a widget. Rejected requests (400, 413) do not use up the allowance. A signed-in
 * user's finished TaskList is saved before the response ends.
 */
export const createGenerateHandler =
  ({
    model,
    now = () => new Date(),
    identify = guest,
    saveUser,
    saveTasks,
    checkRateLimit = noRateLimit,
  }: GenerateHandlerDeps = {}) =>
  async (request: Request): Promise<Response> => {
    const parsed = generateRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request' }, { status: INVALID_REQUEST_STATUS });
    }
    const { prompt, timeZone } = parsed.data;
    const clerkUserId = await identify();
    const limit = promptLimitFor(clerkUserId !== null);
    if (isPromptOverLimit(prompt, limit)) {
      return Response.json({ error: 'Prompt too long', limit }, { status: PROMPT_TOO_LONG_STATUS });
    }
    const blocked = await blockedVerdict(checkRateLimit, {
      clerkUserId,
      ip: clientIp(request.headers),
    });
    if (blocked !== null) return tooManyRequests(blocked, now());
    const userId =
      clerkUserId === null ? null : await saveSignedInUser(saveUser, { clerkUserId, timeZone });
    return streamWidget({
      prompt,
      today: formatPromptDate(now(), timeZone),
      model,
      abortSignal: request.signal,
      onError: logStreamError,
      onWidget:
        userId === null
          ? undefined
          : ({ widget }) => saveGeneratedTasks(saveTasks, userId, widget, now()),
    });
  };
