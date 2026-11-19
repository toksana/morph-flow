import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Progress } from './progress';

describe('Progress', () => {
  it('exposes the value to assistive technology', () => {
    // Arrange
    const value = faker.number.int({ min: 0, max: 100 });

    // Act
    render(<Progress value={value} aria-label="Completion" />);

    // Assert
    expect(screen.getByRole('progressbar', { name: 'Completion' })).toHaveAttribute(
      'aria-valuenow',
      String(value),
    );
  });

  it('renders without a value as indeterminate', () => {
    // Act
    render(<Progress aria-label="Completion" />);

    // Assert
    expect(screen.getByRole('progressbar', { name: 'Completion' })).not.toHaveAttribute(
      'aria-valuenow',
    );
  });
});
