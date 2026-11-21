import { useObject } from '@ai-sdk/react';
import { useState } from 'react';

import type { DeepPartial } from '@/core/widgets/deepPartial';
import type { GenerateRequest } from '@/core/widgets/generate.request';
import { currentTimeZone } from '@/core/widgets/promptDate';
import { minutesUntil, parseRateLimitBody } from '@/core/widgets/rateLimit';
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
  /** Set when the request failed for the hourly limit: whole minutes until it resets. */
  retryInMinutes: number | null;
  generate: (prompt: string) => void;
  stop: () => void;
  /** Stops any request and drops the widget and error, back to the empty state. */
  reset: () => void;
}

interface WidgetStreamOptions {
  /** Called when a request fails (not when it is stopped). */
  onError?: () => void;
}

/**
 * Streams one widget for a prompt, resolving relative dates in the user's time zone.
 * A stream that ends with a half-written widget (status 200, JSON cut off) counts as a failure:
 * `useObject` only reports it through `onFinish`, so it is tracked here.
 */
export const useWidgetStream = ({ onError }: WidgetStreamOptions = {}): WidgetStream => {
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [retryInMinutes, setRetryInMinutes] = useState<number | null>(null);
  const { object, submit, stop, clear, isLoading, error } = useObject<
    typeof widgetResponseSchema,
    WidgetResponse,
    GenerateRequest
  >({
    api: GENERATE_ENDPOINT,
    schema: widgetResponseSchema,
    // A failed response's body arrives as the error message; a 429 carries the reset time.
    onError: (failure) => {
      const rateLimit = parseRateLimitBody(failure.message);
      setRetryInMinutes(rateLimit === null ? null : minutesUntil(rateLimit.reset, Date.now()));
      onError?.();
    },
    onFinish: ({ error: invalid }) => {
      if (invalid === undefined) return;
      setIsIncomplete(true);
      onError?.();
    },
  });
  // A cut-off card is dropped, as for any failed request, so no half-built card sits beside the error.
  const widget = isIncomplete ? undefined : object?.widget;

  return {
    // `submit` clears the object first, so a new request unmounts the previous widget
    // and drops its local state (e.g. a check-in).
    widget,
    hasStarted: (!isIncomplete && object !== undefined) || isLoading,
    isStreaming: isLoading,
    hasError: error !== undefined || isIncomplete,
    retryInMinutes,
    generate: (prompt) => {
      setIsIncomplete(false);
      setRetryInMinutes(null);
      submit({ prompt, timeZone: currentTimeZone() });
    },
    stop,
    reset: () => {
      setIsIncomplete(false);
      setRetryInMinutes(null);
      clear();
    },
  };
};
