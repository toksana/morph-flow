import type { JSX } from 'react';

import { WIDGETS } from '@/core/widgets/widget.schema';
import { Button } from '@/components/ui/button';

export const PRESETS_LABEL = 'Try an example';

interface PromptPresetsProps {
  /** Fills the prompt instead of submitting it, so the user can edit the example first. */
  onPick: (prompt: string) => void;
  disabled: boolean;
}

/** One example per registered widget, taken from its definition. */
export const PromptPresets = ({ onPick, disabled }: PromptPresetsProps): JSX.Element => (
  <div role="group" aria-label={PRESETS_LABEL} className="flex flex-wrap gap-2">
    {WIDGETS.map(({ type, examplePrompt }) => (
      <Button
        key={type}
        type="button"
        variant="outline"
        size="sm"
        className="h-auto max-w-full py-1 text-left whitespace-normal"
        disabled={disabled}
        onClick={() => onPick(examplePrompt)}
      >
        {examplePrompt}
      </Button>
    ))}
  </div>
);
