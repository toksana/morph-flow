import { ArrowUp, Square } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';

export const GENERATE_LABEL = 'Generate';
export const STOP_LABEL = 'Stop';

interface PromptActionProps {
  isStreaming: boolean;
  canSubmit: boolean;
  onStop: () => void;
}

/** Icon button inside the prompt field: send while idle, stop while a widget streams. */
export const PromptAction = ({ isStreaming, canSubmit, onStop }: PromptActionProps): JSX.Element =>
  isStreaming ? (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className="rounded-xl"
      aria-label={STOP_LABEL}
      onClick={onStop}
    >
      <Square aria-hidden className="fill-current" />
    </Button>
  ) : (
    <Button
      type="submit"
      size="icon-lg"
      className="rounded-xl"
      aria-label={GENERATE_LABEL}
      disabled={!canSubmit}
    >
      <ArrowUp aria-hidden />
    </Button>
  );
