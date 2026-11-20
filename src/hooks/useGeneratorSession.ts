import { startTransition, useRef, useState } from 'react';

import { type WidgetStream, useWidgetStream } from './useWidgetStream';

export interface GeneratorSession {
  prompt: string;
  setPrompt: (prompt: string) => void;
  /** True from the first request until "New": the start screen gives way to the card. */
  isOnCanvas: boolean;
  send: (prompt: string) => void;
  startNew: () => void;
  stream: WidgetStream;
}

/** The prompt field, the stream and the start-screen/canvas switch, kept in step. */
export const useGeneratorSession = (): GeneratorSession => {
  const [prompt, setPrompt] = useState('');
  const [isOnCanvas, setIsOnCanvas] = useState(false);
  const sentPromptRef = useRef('');

  // A failed request hands the text back so it can be sent again; text typed since then wins.
  const restoreSentPrompt = (): void =>
    setPrompt((current) => (current === '' ? sentPromptRef.current : current));
  const stream = useWidgetStream({ onError: restoreSentPrompt });

  // A transition, so <ViewTransition> animates the layout change; regular updates would not.
  const showCanvas = (visible: boolean): void => startTransition(() => setIsOnCanvas(visible));

  // The field empties at once, so it is ready for the next request while this one streams.
  const send = (text: string): void => {
    sentPromptRef.current = text;
    setPrompt('');
    showCanvas(true);
    stream.generate(text);
  };

  const startNew = (): void => {
    stream.reset();
    showCanvas(false);
  };

  return { prompt, setPrompt, isOnCanvas, send, startNew, stream };
};
