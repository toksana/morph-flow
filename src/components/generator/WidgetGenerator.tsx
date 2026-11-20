'use client';

import { type JSX, useRef, useState } from 'react';

import { useWidgetStream } from '@/hooks/useWidgetStream';

import { PromptForm } from './PromptForm';
import { PromptPresets } from './PromptPresets';
import { WidgetRenderer } from './WidgetRenderer';

// Generic on purpose: server details stay in the server log.
const ERROR_TEXT = 'Something went wrong. Please try again.';

export const START_PLACEHOLDER =
  'Describe what you need, e.g. "tasks for tomorrow" or "a 30-day reading challenge"';
// Each request builds a new card with no memory of the last one, so this does not promise follow-ups.
export const NEXT_PLACEHOLDER = 'Describe another card — a new task list or habit…';

/** Wires the prompt form to the stream and renders whichever widget the model picks. */
export const WidgetGenerator = (): JSX.Element => {
  const [prompt, setPrompt] = useState('');
  const [hasSent, setHasSent] = useState(false);
  const sentPromptRef = useRef('');

  // A failed request hands the text back so it can be sent again; text typed since then wins.
  const restoreSentPrompt = (): void =>
    setPrompt((current) => (current === '' ? sentPromptRef.current : current));
  const stream = useWidgetStream({ onError: restoreSentPrompt });

  // The field empties at once, so it is ready for the next request while this one streams.
  const send = (text: string): void => {
    sentPromptRef.current = text;
    setPrompt('');
    setHasSent(true);
    stream.generate(text);
  };

  return (
    <div className="flex flex-col gap-4">
      <PromptForm
        value={prompt}
        placeholder={hasSent ? NEXT_PLACEHOLDER : START_PLACEHOLDER}
        onValueChange={setPrompt}
        onSubmit={() => send(prompt)}
        onStop={stream.stop}
        isStreaming={stream.isStreaming}
      />
      <PromptPresets onPick={send} disabled={stream.isStreaming} />
      {stream.hasError && (
        <p role="alert" className="text-sm text-destructive">
          {ERROR_TEXT}
        </p>
      )}
      {stream.hasStarted && (
        <WidgetRenderer widget={stream.widget} isStreaming={stream.isStreaming} />
      )}
    </div>
  );
};
