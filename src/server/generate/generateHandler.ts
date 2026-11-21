import type { LanguageModel } from 'ai';

import { formatPromptDate } from '@/core/widgets/promptDate';
import { generateRequestSchema } from '@/core/widgets/generate.request';
import { isPromptOverLimit, promptLimitFor } from '@/core/widgets/promptLimit';
import type { UserIdentity } from '@/server/db/users';

import { streamWidget } from './streamWidget';

const INVALID_REQUEST_STATUS = 400;
const PROMPT_TOO_LONG_STATUS = 413;

interface GenerateHandlerDeps {
  /** Defaults to the AI Gateway model; tests pass a mock. */
  model?: LanguageModel;
  /** Clock for "today" in the prompt; injected so tests are deterministic. */
  now?: () => Date;
  /** Clerk user id of the caller, or null for a guest. Defaults to treating everyone as a guest. */
  identify?: () => Promise<string | null>;
  /** Stores the signed-in caller's row; skipped for guests. */
  saveUser?: (identity: UserIdentity) => Promise<void>;
}

const guest = async (): Promise<null> => null;
const skipSave = async (): Promise<void> => undefined;

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return undefined;
    throw error;
  }
};

const logError = (scope: string, error: unknown): void => {
  if (error instanceof Error) {
    console.error(`[generate] ${scope}:`, error.message);
    return;
  }
  console.error(`[generate] ${scope} with a non-Error value:`, error);
};

const logStreamError = (error: unknown): void => logError('stream failed', error);

/** A database hiccup must not cost the user their card: log it and keep generating. */
const saveSignedInUser = async (
  saveUser: (identity: UserIdentity) => Promise<void>,
  clerkUserId: string,
  timeZone: string,
): Promise<void> => {
  try {
    await saveUser({ clerkUserId, timeZone });
  } catch (error) {
    logError('saving the user failed', error);
  }
};

/** Builds the POST handler: validate the body, apply the caller's prompt limit, then stream a widget. */
export const createGenerateHandler =
  ({
    model,
    now = () => new Date(),
    identify = guest,
    saveUser = skipSave,
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
    if (clerkUserId !== null) await saveSignedInUser(saveUser, clerkUserId, timeZone);
    return streamWidget({
      prompt,
      today: formatPromptDate(now(), timeZone),
      model,
      abortSignal: request.signal,
      onError: logStreamError,
    });
  };
