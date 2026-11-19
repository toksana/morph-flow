import {
  createTextStreamResponse,
  type GatewayModelId,
  type LanguageModel,
  Output,
  streamText,
  toTextStream,
} from 'ai';

import { MAX_TASKS, MIN_TASKS, taskListSchema } from '@/core/widgets/taskList.schema';

export const TASK_LIST_MODEL: GatewayModelId = 'anthropic/claude-haiku-5.5';

/**
 * Behaviour rules for the model. Field formats (title length, date format) live in the
 * schema descriptions, which reach the model as JSON Schema.
 * @param today the user's calendar day, e.g. "Thursday, 2026-11-19"
 */
export const buildTaskListSystemPrompt = (today: string): string =>
  [
    'You turn a user request into a short, actionable task list.',
    `Today is ${today}.`,
    'If the user gives a broad goal (e.g. "launch an MVP"), break it down into concrete steps. If they list specific items, keep them intact.',
    `Return between ${MIN_TASKS} and ${MAX_TASKS} tasks, ordered as the user would do them.`,
    'Write the list title and every task title in the language of the user request.',
    'Set done to true only for tasks the user says are already finished.',
    'Set a due date (YYYY-MM-DD, date only) only when the request names a specific date or a relative one ("tomorrow", "next Friday"); resolve relative dates from today; never invent dates.',
  ].join('\n');

interface StreamTaskListOptions {
  prompt: string;
  today: string;
  model?: LanguageModel;
  onError?: (error: unknown) => void;
}

/** Streams a TaskList as partial JSON text, the format `useObject` consumes. */
export const streamTaskList = ({
  prompt,
  today,
  model = TASK_LIST_MODEL,
  onError,
}: StreamTaskListOptions): Response => {
  const result = streamText({
    model,
    system: buildTaskListSystemPrompt(today),
    prompt,
    output: Output.object({ schema: taskListSchema }),
    onError: ({ error }) => onError?.(error),
  });

  return createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) });
};
