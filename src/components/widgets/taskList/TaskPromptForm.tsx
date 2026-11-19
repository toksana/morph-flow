import { type FormEvent, type JSX, type KeyboardEvent, useId, useRef } from 'react';

import { MAX_PROMPT_LENGTH } from '@/core/widgets/taskList.request';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAdoptPreHydrationValue } from '@/hooks/useAdoptPreHydrationValue';

const PROMPT_LABEL = 'What do you want to get done?';
const PROMPT_PLACEHOLDER = "e.g. Call the garage tomorrow, book a doctor's appointment";

interface TaskPromptFormProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
}

/** Enter submits, Shift+Enter adds a line, and IME composition (e.g. Japanese input) is left alone. */
const isSubmitKey = (event: KeyboardEvent<HTMLTextAreaElement>): boolean =>
  event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;

export const TaskPromptForm = ({
  value,
  onValueChange,
  onSubmit,
  onStop,
  isStreaming,
}: TaskPromptFormProps): JSX.Element => {
  const promptId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useAdoptPreHydrationValue(textareaRef, onValueChange);
  const canSubmit = value.trim() !== '' && !isStreaming;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (canSubmit) onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (!isSubmitKey(event)) return;
    event.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={promptId} className="text-sm font-medium">
        {PROMPT_LABEL}
      </label>
      <Textarea
        id={promptId}
        ref={textareaRef}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={PROMPT_PLACEHOLDER}
        maxLength={MAX_PROMPT_LENGTH}
        rows={3}
      />
      <div className="flex justify-end">
        {isStreaming ? (
          <Button type="button" variant="outline" onClick={onStop}>
            Stop
          </Button>
        ) : (
          <Button type="submit" disabled={!canSubmit}>
            Generate
          </Button>
        )}
      </div>
    </form>
  );
};
