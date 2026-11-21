import type { LanguageModel } from 'ai';

import { formatPromptDate } from '@/core/widgets/promptDate';
import { generateRequestSchema } from '@/core/widgets/generate.request';
import type { UserIdentity } from '@/server/db/users';

import { streamWidget } from './streamWidget';

const INVALID_REQUEST_STATUS = 400;

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
  identify: () => Promise<string | null>,
  saveUser: (identity: UserIdentity) => Promise<void>,
  timeZone: string,
): Promise<void> => {
  const clerkUserId = await identify();
  if (clerkUserId === null) return;
  try {
    await saveUser({ clerkUserId, timeZone });
  } catch (error) {
    logError('saving the user failed', error);
  }
};

/** Builds the POST handler: validate the body, then stream a widget for the user's day. */
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
    await saveSignedInUser(identify, saveUser, timeZone);
    return streamWidget({
      prompt,
      today: formatPromptDate(now(), timeZone),
      model,
      abortSignal: request.signal,
      onError: logStreamError,
    });
  };
