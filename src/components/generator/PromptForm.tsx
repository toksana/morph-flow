import { Terminal } from 'lucide-react';
import { type FormEvent, type JSX, type KeyboardEvent, type ReactNode, useId, useRef } from 'react';

import { promptLengthTone } from '@/core/widgets/promptLimit';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAdoptPreHydrationValue } from '@/hooks/useAdoptPreHydrationValue';

import { PromptAction } from './PromptAction';
import { PromptCounter } from './PromptCounter';
import { PromptLimitNotice } from './PromptLimitNotice';

export const PROMPT_LABEL = 'What do you want to create?';

interface PromptFormProps {
  value: string;
  placeholder: string;
  /** Docked at the bottom: a shorter field, since its placeholder fits in fewer lines. */
  isDocked: boolean;
  /** Shown at the left end of the toolbar under the field, e.g. a "New" button. */
  leading?: ReactNode;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  isStreaming: boolean;
  /** Longest prompt the caller may send; longer text stays editable but cannot be sent. */
  limit: number;
  isSignedIn: boolean;
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
  limit,
  isSignedIn,
}: PromptFormProps): JSX.Element => {
  const promptId = useId();
  const counterId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useAdoptPreHydrationValue(textareaRef, onValueChange);
  // Counted like the server counts: on the trimmed text.
  const length = value.trim().length;
  const tone = promptLengthTone(length, limit);
  const isOverLimit = tone === 'over';
  const canSubmit = length > 0 && !isStreaming && !isOverLimit;

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
      {isOverLimit && <PromptLimitNotice limit={limit} isSignedIn={isSignedIn} />}
      {/* Translucent with a blur, so cards scrolling under the dock stay faintly visible.
          The field sits on top and a toolbar below it, so the text never runs under the
          counter or the buttons. */}
      <div className="flex flex-col rounded-2xl border bg-card/85 p-2 shadow-sm backdrop-blur-md transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <div className="flex items-start gap-2">
          <Terminal aria-hidden className="mt-3 ml-2 size-4 shrink-0 text-muted-foreground" />
          {/* The field grows with its text up to a ceiling, then scrolls inside. The ceiling is
              lower on a phone, where the on-screen keyboard already takes half the screen.
              When empty it sizes to the placeholder, so the minimum must fit it or it shrinks on
              the first keystroke: in the dock 2 lines on a phone, 1 wider (8px padding each
              side; lines are 24px below md, 20px from md). Text stays 16px below md (from the
              Textarea), so Safari on iPhone does not zoom in on focus. */}
          <Textarea
            id={promptId}
            ref={textareaRef}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            aria-invalid={isOverLimit}
            aria-describedby={tone === 'hidden' ? undefined : counterId}
            className={cn(
              'max-h-32 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 aria-invalid:ring-0 md:max-h-48 dark:bg-transparent',
              isDocked ? 'min-h-16 sm:min-h-10 md:min-h-9' : 'min-h-24',
            )}
          />
        </div>
        <div className="mt-1 flex items-center justify-end gap-3 pt-2">
          {leading !== undefined && <div className="mr-auto">{leading}</div>}
          <PromptCounter id={counterId} length={length} limit={limit} tone={tone} />
          <PromptAction isStreaming={isStreaming} canSubmit={canSubmit} onStop={onStop} />
        </div>
      </div>
    </form>
  );
};
