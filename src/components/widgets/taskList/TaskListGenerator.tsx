'use client';

import { type JSX, useState } from 'react';

import { useTaskListStream } from '@/hooks/useTaskListStream';

import { TaskList } from './TaskList';
import { TaskPromptForm } from './TaskPromptForm';

// Generic on purpose: server details stay in the server log.
const ERROR_TEXT = 'Something went wrong. Please try again.';

/** Wires the prompt form to the stream and renders the list as it arrives. */
export const TaskListGenerator = (): JSX.Element => {
  const [prompt, setPrompt] = useState('');
  const stream = useTaskListStream();

  return (
    <div className="flex flex-col gap-4">
      <TaskPromptForm
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={() => stream.generate(prompt)}
        onStop={stream.stop}
        isStreaming={stream.isStreaming}
      />
      {stream.hasError && (
        <p role="alert" className="text-sm text-destructive">
          {ERROR_TEXT}
        </p>
      )}
      {stream.hasStarted && <TaskList view={stream.view} isStreaming={stream.isStreaming} />}
    </div>
  );
};
