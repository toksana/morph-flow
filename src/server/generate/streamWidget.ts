import {
  createTextStreamResponse,
  type GatewayModelId,
  type LanguageModel,
  Output,
  streamText,
  toTextStream,
} from 'ai';

import { DEFAULT_TARGET_DAYS } from '@/core/widgets/habitStreakCard.schema';
import { MAX_TASKS, MIN_TASKS } from '@/core/widgets/taskList.schema';
import { widgetResponseSchema } from '@/core/widgets/widget.schema';

export const WIDGET_MODEL: GatewayModelId = 'anthropic/claude-haiku-5.5';

const WIDGET_CHOICE_RULES = [
  'You turn a user request into exactly one widget.',
  'Choose HabitStreakCard when the user wants to track one repeated habit, a streak or an N-day challenge (e.g. "track my daily run", "30-day reading challenge").',
  'Choose TaskList for anything else: one-off tasks, plans, goals to break down, or several different to-dos.',
  'Write every title in the language of the user request.',
];

const TASK_LIST_RULES = [
  'For a TaskList:',
  'If the user gives a broad goal (e.g. "launch an MVP"), break it down into concrete steps. If they list specific items, keep them intact.',
  `Return between ${MIN_TASKS} and ${MAX_TASKS} tasks, ordered as the user would do them.`,
  'Set done to true only for tasks the user says are already finished.',
  'Set a due date (YYYY-MM-DD, date only) only when the request names a specific date or a relative one ("tomorrow", "next Friday"); resolve relative dates from today; never invent dates.',
];

const HABIT_STREAK_RULES = [
  'For a HabitStreakCard:',
  'Take streakDays from the request; use 0 when the user gives no streak, never invent one.',
  'Set completedToday to true only when the user says the habit is already done today.',
  `Take targetDays from a challenge length or goal the user names; otherwise use ${DEFAULT_TARGET_DAYS}.`,
];

/**
 * Behaviour rules for the model. Field formats (title length, date format) live in the
 * schema descriptions, which reach the model as JSON Schema.
 * @param today the user's calendar day, e.g. "Thursday, 2026-11-19"
 */
export const buildWidgetSystemPrompt = (today: string): string =>
  [
    ...WIDGET_CHOICE_RULES,
    `Today is ${today}.`,
    '',
    ...TASK_LIST_RULES,
    '',
    ...HABIT_STREAK_RULES,
  ].join('\n');

interface StreamWidgetOptions {
  prompt: string;
  today: string;
  model?: LanguageModel;
  onError?: (error: unknown) => void;
}

/** Streams `{ widget }` as partial JSON text, the format `useObject` consumes. */
export const streamWidget = ({
  prompt,
  today,
  model = WIDGET_MODEL,
  onError,
}: StreamWidgetOptions): Response => {
  const result = streamText({
    model,
    system: buildWidgetSystemPrompt(today),
    prompt,
    output: Output.object({ schema: widgetResponseSchema }),
    onError: ({ error }) => onError?.(error),
  });

  return createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) });
};
