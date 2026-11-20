import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BRAND, Hero, HEADLINE, SUBTITLE } from './Hero';

describe('Hero', () => {
  it('gives the page a single top-level heading that says what the app is', () => {
    // Act
    render(<Hero />);

    // Assert
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(HEADLINE);
  });

  it('shows the brand and the subtitle as text, not as headings', () => {
    // Act
    render(<Hero />);

    // Assert
    expect(screen.getByText(BRAND).tagName).toBe('P');
    expect(screen.getByText(SUBTITLE).tagName).toBe('P');
  });
});
