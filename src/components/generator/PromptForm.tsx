import { Terminal } from 'lucide-react';
import { type FormEvent, type JSX, type KeyboardEvent, useId, useRef } from 'react';

import { MAX_PROMPT_LENGTH } from '@/core/widgets/generate.request';
import { Textarea } from '@/components/ui/textarea';
import { useAdoptPreHydrationValue } from '@/hooks/useAdoptPreHydrationValue';

import { PromptAction } from './PromptAction';

export const PROMPT_LABEL = 'What do you want to create?';

interface PromptFormProps {
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
}

/** Enter submits, Shift+Enter adds a line, and IME composition (e.g. Japanese input) is left alone. */
const isSubmitKey = (event: KeyboardEvent<HTMLTextAreaElement>): boolean =>
  event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;

export const PromptForm = ({
  value,
  placeholder,
  onValueChange,
  onSubmit,
  onStop,
  isStreaming,
}: PromptFormProps): JSX.Element => {
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
    <form onSubmit={handleSubmit}>
      <label htmlFor={promptId} className="sr-only">
        {PROMPT_LABEL}
      </label>
      <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <Terminal
          aria-hidden
          className="mt-3 ml-2 size-4 shrink-0 self-start text-muted-foreground"
        />
        <Textarea
          id={promptId}
          ref={textareaRef}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={MAX_PROMPT_LENGTH}
          rows={1}
          className="min-h-24 max-h-60 flex-1 resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <PromptAction isStreaming={isStreaming} canSubmit={canSubmit} onStop={onStop} />
      </div>
    </form>
  );
};
