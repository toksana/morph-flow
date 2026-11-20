import { useObject } from '@ai-sdk/react';

import type { DeepPartial } from '@/core/widgets/deepPartial';
import type { GenerateRequest } from '@/core/widgets/generate.request';
import { currentTimeZone } from '@/core/widgets/promptDate';
import {
  type Widget,
  type WidgetResponse,
  widgetResponseSchema,
} from '@/core/widgets/widget.schema';

export const GENERATE_ENDPOINT = '/api/generate';

export interface WidgetStream {
  /** The widget streamed so far; its `type` may still be missing or half-written. */
  widget: DeepPartial<Widget> | undefined;
  /** True once a request is in flight or data has arrived, so a placeholder can show before the first chunk. */
  hasStarted: boolean;
  isStreaming: boolean;
  hasError: boolean;
  generate: (prompt: string) => void;
  stop: () => void;
  /** Stops any request and drops the widget and error, back to the empty state. */
  reset: () => void;
}

interface WidgetStreamOptions {
  /** Called when a request fails (not when it is stopped). */
  onError?: () => void;
}

/** Streams one widget for a prompt, resolving relative dates in the user's time zone. */
export const useWidgetStream = ({ onError }: WidgetStreamOptions = {}): WidgetStream => {
  const { object, submit, stop, clear, isLoading, error } = useObject<
    typeof widgetResponseSchema,
    WidgetResponse,
    GenerateRequest
  >({ api: GENERATE_ENDPOINT, schema: widgetResponseSchema, onError: () => onError?.() });

  return {
    // `submit` clears the object first, so a new request unmounts the previous widget
    // and drops its local state (e.g. a check-in).
    widget: object?.widget,
    hasStarted: object !== undefined || isLoading,
    isStreaming: isLoading,
    hasError: error !== undefined,
    generate: (prompt) => submit({ prompt, timeZone: currentTimeZone() }),
    stop,
    reset: clear,
  };
};
