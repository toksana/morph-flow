import { faker } from '@faker-js/faker';
import { render } from '@testing-library/react';
import { act, type JSX, useRef, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { useAdoptPreHydrationValue } from './useAdoptPreHydrationValue';

/** A controlled field like the real prompt form: adopted text lands in state. */
const Field = ({ onValue }: { onValue: (value: string) => void }): JSX.Element => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');
  useAdoptPreHydrationValue(ref, (adopted) => {
    onValue(adopted);
    setValue(adopted);
  });
  return <textarea ref={ref} value={value} onChange={(event) => setValue(event.target.value)} />;
};

/** Types into server HTML the way a browser does before React has attached listeners. */
const typeBeforeHydration = (field: HTMLTextAreaElement, text: string): void => {
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setValue?.call(field, text);
  field.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('useAdoptPreHydrationValue', () => {
  it('hands text typed before hydration to the callback once, even across re-renders', async () => {
    // Arrange
    const text = faker.lorem.sentence();
    const onValue = vi.fn();
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Field onValue={onValue} />);
    document.body.append(container);
    typeBeforeHydration(container.querySelector('textarea') as HTMLTextAreaElement, text);

    // Act
    const root = await act(async () => hydrateRoot(container, <Field onValue={onValue} />));
    await act(async () => root.render(<Field onValue={onValue} />));
    await act(async () => root.render(<Field onValue={onValue} />));

    // Assert
    expect(onValue).toHaveBeenCalledTimes(1);
    expect(onValue).toHaveBeenCalledWith(text);
    container.remove();
  });

  it('stays silent when nothing was typed', () => {
    // Arrange
    const onValue = vi.fn();

    // Act
    render(<Field onValue={onValue} />);

    // Assert
    expect(onValue).not.toHaveBeenCalled();
  });
});
