import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GeneratorPresets } from './GeneratorPresets';
import { PRESETS_LABEL } from './PromptPresets';

describe('GeneratorPresets', () => {
  it('renders nothing outside a WidgetGenerator, with nobody to send the example', () => {
    // Act
    const { container } = render(<GeneratorPresets />);

    // Assert
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('group', { name: PRESETS_LABEL })).toBeNull();
  });
});
