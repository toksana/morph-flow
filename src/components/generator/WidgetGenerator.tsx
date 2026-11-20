'use client';

import { type JSX, useState } from 'react';

import { useWidgetStream } from '@/hooks/useWidgetStream';

import { PromptForm } from './PromptForm';
import { PromptPresets } from './PromptPresets';
import { WidgetRenderer } from './WidgetRenderer';

// Generic on purpose: server details stay in the server log.
const ERROR_TEXT = 'Something went wrong. Please try again.';

/** Wires the prompt form to the stream and renders whichever widget the model picks. */
export const WidgetGenerator = (): JSX.Element => {
  const [prompt, setPrompt] = useState('');
  const stream = useWidgetStream();

  // A preset runs at once; its text stays in the field so it can be edited and sent again.
  const generateExample = (example: string): void => {
    setPrompt(example);
    stream.generate(example);
  };

  return (
    <div className="flex flex-col gap-4">
      <PromptForm
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={() => stream.generate(prompt)}
        onStop={stream.stop}
        isStreaming={stream.isStreaming}
      />
      <PromptPresets onPick={generateExample} disabled={stream.isStreaming} />
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
