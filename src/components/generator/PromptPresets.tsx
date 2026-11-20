import { type JSX, useId } from 'react';

import { WIDGETS } from '@/core/widgets/widget.schema';
import { Button } from '@/components/ui/button';
import { WIDGET_ACCENTS } from '@/components/widgets/widgetAccents';

export const PRESETS_LABEL = 'Or try an example';

interface PromptPresetsProps {
  /** Called with the example text; the generator sends it right away. */
  onPick: (prompt: string) => void;
  disabled: boolean;
}

/** One example per registered widget, taken from its definition and marked with its icon and hue. */
export const PromptPresets = ({ onPick, disabled }: PromptPresetsProps): JSX.Element => {
  const labelId = useId();

  return (
    <div className="flex flex-col items-center gap-3">
      <p id={labelId} className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {PRESETS_LABEL}
      </p>
      <div role="group" aria-labelledby={labelId} className="flex flex-col items-center gap-2">
        {WIDGETS.map(({ type, examplePrompt }) => {
          const { icon: Icon, iconClass } = WIDGET_ACCENTS[type];
          return (
            <Button
              key={type}
              type="button"
              variant="outline"
              className="h-auto max-w-full rounded-full px-4 py-2 text-left whitespace-normal"
              disabled={disabled}
              onClick={() => onPick(examplePrompt)}
            >
              <Icon aria-hidden className={iconClass} />
              {examplePrompt}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
