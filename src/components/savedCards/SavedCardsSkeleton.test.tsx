import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  SAVED_CARDS_SKELETON_LABEL,
  SKELETON_ROW_COUNT,
  SavedCardsSkeleton,
} from './SavedCardsSkeleton';
import { PAIR_GRID_CLASS } from './StartCards';

describe('SavedCardsSkeleton', () => {
  it('announces the loading cards to screen readers', () => {
    // Act
    render(<SavedCardsSkeleton />);

    // Assert
    const status = screen.getByRole('status', { name: SAVED_CARDS_SKELETON_LABEL });
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('holds the place of both cards in the same grid as the loaded pair', () => {
    // Act
    render(<SavedCardsSkeleton />);

    // Assert
    const status = screen.getByRole('status');
    expect(status).toHaveClass(...PAIR_GRID_CLASS.split(' '));
    const cards = status.querySelectorAll(':scope > [data-slot="card"]');
    expect(cards).toHaveLength(2);
    cards.forEach((card) =>
      expect(within(card as HTMLElement).getAllByRole('listitem')).toHaveLength(SKELETON_ROW_COUNT),
    );
  });

  it('shows the round check-in placeholder in the habits card only', () => {
    // Act
    render(<SavedCardsSkeleton />);

    // Assert
    const [tasksCard, habitsCard] = screen
      .getByRole('status')
      .querySelectorAll(':scope > [data-slot="card"]');
    expect(habitsCard.querySelectorAll('.rounded-full.size-9')).toHaveLength(SKELETON_ROW_COUNT);
    expect(tasksCard.querySelectorAll('.rounded-full.size-9')).toHaveLength(0);
  });
});
