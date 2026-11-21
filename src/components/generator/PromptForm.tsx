import { Terminal } from 'lucide-react';
import { type FormEvent, type JSX, type KeyboardEvent, type ReactNode, useId, useRef } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAdoptPreHydrationValue } from '@/hooks/useAdoptPreHydrationValue';

import { PromptAction } from './PromptAction';

export const PROMPT_LABEL = 'What do you want to create?';

interface PromptFormProps {
  value: string;
  placeholder: string;
  /** Docked at the bottom: a shorter field, since its placeholder fits in fewer lines. */
  isDocked: boolean;
  /** Shown left of the field instead of the prompt icon, e.g. a "New" button. */
  leading?: ReactNode;
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
  isDocked,
  leading,
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
      {/* Translucent with a blur, so cards scrolling under the dock stay faintly visible. */}
      <div
        className={cn(
          'flex items-end gap-2 rounded-2xl border bg-card/85 p-2 shadow-sm backdrop-blur-md transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          // On a phone the docked field is two lines tall: centre the buttons beside it.
          isDocked && 'max-sm:items-center',
        )}
      >
        {leading ?? (
          <Terminal
            aria-hidden
            className="mt-3 ml-2 size-4 shrink-0 self-start text-muted-foreground"
          />
        )}
        {/* The field grows with its text and, when empty, sizes to the placeholder, so the minimum
            must fit it or it shrinks on the first keystroke. In the dock the minimum is exactly the
            placeholder's height (8px padding each side; lines are 24px below md, 20px from md):
            2 lines on a phone, 1 wider. From md that is 36px, level with the buttons. */}
        <Textarea
          id={promptId}
          ref={textareaRef}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'flex-1 resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent',
            isDocked ? 'max-h-40 min-h-16 sm:min-h-10 md:min-h-9' : 'max-h-60 min-h-24',
          )}
        />
        <PromptAction isStreaming={isStreaming} canSubmit={canSubmit} onStop={onStop} />
      </div>
    </form>
  );
};
