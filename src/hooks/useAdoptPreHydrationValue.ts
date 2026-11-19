import { type RefObject, useEffect, useEffectEvent } from 'react';

type TextField = HTMLInputElement | HTMLTextAreaElement;

/**
 * Text typed into a server-rendered field before hydration lives only in the DOM:
 * React hydrates with its own (empty) state and would overwrite it on the next render.
 * After hydration, hand any such text to the controlled state once.
 */
export const useAdoptPreHydrationValue = (
  ref: RefObject<TextField | null>,
  onValue: (value: string) => void,
): void => {
  const adopt = useEffectEvent(onValue);

  useEffect(() => {
    const typed = ref.current?.value ?? '';
    if (typed !== '') adopt(typed);
  }, [ref]);
};
