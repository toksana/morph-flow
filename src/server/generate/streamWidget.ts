import {
  createTextStreamResponse,
  type GatewayModelId,
  type LanguageModel,
  Output,
  streamText,
  toTextStream,
} from 'ai';

import type { WidgetDefinition } from '@/core/widgets/widgetDefinition';
import { WIDGETS, widgetResponseSchema } from '@/core/widgets/widget.schema';

export const WIDGET_MODEL: GatewayModelId = 'anthropic/claude-haiku-5.5';

type PromptWidget = Pick<WidgetDefinition, 'type' | 'whenToUse' | 'rules'>;

const choiceSection = (widgets: readonly PromptWidget[]): string[] => [
  'You turn a user request into exactly one widget. Choose the widget whose description fits best:',
  ...widgets.map((widget) => `- ${widget.type}: ${widget.whenToUse}`),
  'Write every title in the language of the user request.',
];

const rulesSection = (widget: PromptWidget): string[] => [
  '',
  `For a ${widget.type}:`,
  ...widget.rules,
];

/**
 * Behaviour rules for the model, built from the widget registry. Field formats (title length,
 * date format) live in the schema descriptions, which reach the model as JSON Schema.
 * @param today the user's calendar day, e.g. "Thursday, 2026-11-19"
 */
export const buildWidgetSystemPrompt = (
  today: string,
  widgets: readonly PromptWidget[] = WIDGETS,
): string =>
  [...choiceSection(widgets), `Today is ${today}.`, ...widgets.flatMap(rulesSection)].join('\n');

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
