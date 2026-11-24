import type { JSX, ReactElement } from 'react';

import { GeneratorPresets } from '@/components/generator/GeneratorPresets';
import { COLUMN_CLASS } from '@/components/generator/layoutClasses';

/** Two cards side by side from `md` (768px), stacked in the given order below it. */
export const PAIR_GRID_CLASS = 'grid grid-cols-1 gap-4 md:grid-cols-2';

interface StartCardsProps {
  /** The saved cards that have something to show, in reading order; each with its own key. */
  cards: ReactElement[];
}

/**
 * A signed-in user's saved cards under the field. Empty cards are left out by the caller, so:
 * none → the examples, as a first step; one → the reading column; two → a bento pair.
 */
export const StartCards = ({ cards }: StartCardsProps): JSX.Element | null => {
  if (cards.length === 0) return <GeneratorPresets />;
  return <div className={cards.length === 1 ? COLUMN_CLASS : PAIR_GRID_CLASS}>{cards}</div>;
};
