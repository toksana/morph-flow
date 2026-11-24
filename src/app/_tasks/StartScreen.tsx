import { type JSX, Suspense } from 'react';

import { WidgetGenerator } from '@/components/generator/WidgetGenerator';
import { Hero } from '@/components/landing/Hero';
import { SavedCardsSkeleton } from '@/components/savedCards/SavedCardsSkeleton';

import { identifyCaller } from './deps';
import { SavedCards } from './SavedCards';

/**
 * The generator, laid out for who is looking. A guest gets the pitch: hero, centered field,
 * examples. A signed-in user already knows the app, so the field sits at the top with their
 * saved tasks and habits right below it. Reads the session: render it inside <Suspense>.
 */
export const StartScreen = async (): Promise<JSX.Element> => {
  const isSignedIn = (await identifyCaller()) !== null;
  if (!isSignedIn) return <WidgetGenerator intro={<Hero />} />;
  return (
    <WidgetGenerator
      layout="top"
      start={
        // The cards need the database; the field above them does not wait for it, and their
        // skeleton holds the place meanwhile.
        <Suspense fallback={<SavedCardsSkeleton />}>
          <SavedCards />
        </Suspense>
      }
    />
  );
};
