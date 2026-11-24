'use client';

import { type JSX, type ReactNode, ViewTransition } from 'react';

import { useGeneratorSession } from '@/hooks/useGeneratorSession';
import { usePromptLimit } from '@/hooks/usePromptLimit';
import { cn } from '@/lib/utils';

import { NewCardButton } from './NewCardButton';
import { PromptForm } from './PromptForm';
import { RateLimitNotice } from './RateLimitNotice';
import { PromptPresets } from './PromptPresets';
import { WidgetRenderer } from './WidgetRenderer';

// Generic on purpose: server details stay in the server log.
const ERROR_TEXT = 'Something went wrong. Please try again.';

export const START_PLACEHOLDER =
  'Describe what you need, e.g. "tasks for tomorrow" or "a 30-day reading challenge"';
// Each request builds a new card with no memory of the last one, so this does not promise follow-ups.
export const NEXT_PLACEHOLDER = 'Describe another card — a new task list or habit…';

// The dock floats over the canvas, so the canvas leaves room for it below the last card. Both
// add the iPhone home-indicator inset (0 elsewhere), so the dock never sits on the swipe bar.
// An offset rather than padding: padding would show as an empty strip inside the dock's shadow.
const DOCK_CLASS =
  'fixed inset-x-4 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-10 mx-auto max-w-2xl rounded-2xl shadow-lg';
const CANVAS_DOCK_ROOM_CLASS = 'pb-[calc(12rem+env(safe-area-inset-bottom))]';

interface WidgetGeneratorProps {
  /** Start-screen content above the field (e.g. the hero); hidden once a card is requested. */
  intro?: ReactNode;
  /** The signed-in user's saved tasks, under the examples; hidden on the canvas like the intro. */
  saved?: ReactNode;
}

/**
 * Start screen: intro, a centred field and examples. After the first request the canvas shows the
 * card and the field moves to a dock at the bottom. Every child keeps its slot in both states, so
 * the field is the same element (it keeps focus) and only its position animates.
 */
export const WidgetGenerator = ({ intro, saved }: WidgetGeneratorProps): JSX.Element => {
  const { prompt, setPrompt, isOnCanvas, send, startNew, stream } = useGeneratorSession();
  const { limit, isSignedIn } = usePromptLimit();

  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-10 py-16',
        isOnCanvas ? CANVAS_DOCK_ROOM_CLASS : 'justify-center',
      )}
    >
      {!isOnCanvas && intro}
      {isOnCanvas && (
        <section className="flex flex-col gap-4">
          {stream.hasError &&
            (stream.retryInMinutes === null ? (
              <p role="alert" className="text-sm text-destructive">
                {ERROR_TEXT}
              </p>
            ) : (
              <RateLimitNotice minutes={stream.retryInMinutes} isSignedIn={isSignedIn} />
            ))}
          {stream.hasStarted && (
            <WidgetRenderer widget={stream.widget} isStreaming={stream.isStreaming} />
          )}
        </section>
      )}
      <ViewTransition name="command-input">
        <div className={cn(isOnCanvas && DOCK_CLASS)}>
          <PromptForm
            value={prompt}
            placeholder={isOnCanvas ? NEXT_PLACEHOLDER : START_PLACEHOLDER}
            isDocked={isOnCanvas}
            leading={isOnCanvas ? <NewCardButton onClick={startNew} /> : undefined}
            onValueChange={setPrompt}
            onSubmit={() => send(prompt)}
            onStop={stream.stop}
            isStreaming={stream.isStreaming}
            limit={limit}
            isSignedIn={isSignedIn}
          />
        </div>
      </ViewTransition>
      {!isOnCanvas && <PromptPresets onPick={send} disabled={stream.isStreaming} />}
      {!isOnCanvas && saved}
    </div>
  );
};
