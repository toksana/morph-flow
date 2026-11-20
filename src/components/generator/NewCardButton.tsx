import { Plus } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';

export const NEW_CARD_LABEL = 'New';

interface NewCardButtonProps {
  onClick: () => void;
}

/** Leaves the canvas: drops the card and brings back the start screen. Outlined like the send button so it reads as a button. */
export const NewCardButton = ({ onClick }: NewCardButtonProps): JSX.Element => (
  <Button
    type="button"
    variant="outline"
    size="lg"
    className="shrink-0 rounded-xl bg-transparent px-2.5 text-muted-foreground sm:px-3 dark:bg-transparent"
    onClick={onClick}
  >
    <Plus aria-hidden />
    {/* Icon only on a phone, where the dock is narrow; the name stays for screen readers. */}
    <span className="sr-only sm:not-sr-only">{NEW_CARD_LABEL}</span>
  </Button>
);
