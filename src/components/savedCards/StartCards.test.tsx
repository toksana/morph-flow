import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PresetsContext } from '@/components/generator/GeneratorPresets';
import { COLUMN_CLASS } from '@/components/generator/layoutClasses';
import { PRESETS_LABEL } from '@/components/generator/PromptPresets';

import { PAIR_GRID_CLASS, StartCards } from './StartCards';

const buildCards = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const title = `${faker.lorem.words(2)} ${index}`;
    return (
      <article key={title} aria-label={title}>
        {title}
      </article>
    );
  });

const renderInGenerator = (cards: ReturnType<typeof buildCards>) =>
  render(
    <PresetsContext value={{ send: vi.fn(), disabled: false }}>
      <StartCards cards={cards} />
    </PresetsContext>,
  );

describe('StartCards', () => {
  it('offers the examples instead of empty cards when there is nothing saved', () => {
    // Act
    renderInGenerator([]);

    // Assert
    expect(screen.getByRole('group', { name: PRESETS_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('puts a lone card in the reading column, without the grid', () => {
    // Arrange
    const cards = buildCards(1);

    // Act
    renderInGenerator(cards);

    // Assert
    const card = screen.getByRole('article');
    expect(card.parentElement).toHaveClass(...COLUMN_CLASS.split(' '));
    expect(card.parentElement).not.toHaveClass('grid');
    expect(screen.queryByRole('group', { name: PRESETS_LABEL })).toBeNull();
  });

  it('puts two cards in a grid, one column on a phone and two from md, in the given order', () => {
    // Arrange
    const cards = buildCards(2);

    // Act
    renderInGenerator(cards);

    // Assert
    const rendered = screen.getAllByRole('article');
    expect(rendered.map((card) => card.getAttribute('aria-label'))).toEqual(
      cards.map((card) => card.key),
    );
    expect(rendered[0].parentElement).toHaveClass(...PAIR_GRID_CLASS.split(' '));
    expect(rendered[1].parentElement).toBe(rendered[0].parentElement);
  });
});
