import type { LanguageModel } from 'ai';

import { formatPromptDate } from '@/core/widgets/promptDate';
import { generateRequestSchema } from '@/core/widgets/generate.request';

import { streamTaskList } from './streamTaskList';

const INVALID_REQUEST_STATUS = 400;

interface TaskListHandlerDeps {
  /** Defaults to the AI Gateway model; tests pass a mock. */
  model?: LanguageModel;
  /** Clock for "today" in the prompt; injected so tests are deterministic. */
  now?: () => Date;
}

const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return undefined;
    throw error;
  }
};

const logStreamError = (error: unknown): void => {
  if (error instanceof Error) {
    console.error('[task-list] stream failed:', error.message);
    return;
  }
  console.error('[task-list] stream failed with a non-Error value:', error);
};

/** Builds the POST handler: validate the body, then stream a TaskList for the user's day. */
export const createTaskListHandler =
  ({ model, now = () => new Date() }: TaskListHandlerDeps = {}) =>
  async (request: Request): Promise<Response> => {
    const parsed = generateRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request' }, { status: INVALID_REQUEST_STATUS });
    }
    const { prompt, timeZone } = parsed.data;
    return streamTaskList({
      prompt,
      today: formatPromptDate(now(), timeZone),
      model,
      onError: logStreamError,
    });
  };
