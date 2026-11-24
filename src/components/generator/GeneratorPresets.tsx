'use client';

import { type JSX, createContext, useContext } from 'react';

import { PromptPresets } from './PromptPresets';

interface PresetsContextValue {
  send: (prompt: string) => void;
  disabled: boolean;
}

/** Lets slot content from a Server Component render the examples wired to this generator. */
export const PresetsContext = createContext<PresetsContextValue | null>(null);

/** The examples, sending through the surrounding WidgetGenerator. Renders nothing outside one. */
export const GeneratorPresets = (): JSX.Element | null => {
  const context = useContext(PresetsContext);
  if (context === null) return null;
  return <PromptPresets onPick={context.send} disabled={context.disabled} />;
};
