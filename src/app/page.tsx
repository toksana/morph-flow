import { Suspense } from 'react';

import { WidgetGenerator } from '@/components/generator/WidgetGenerator';
import { Hero } from '@/components/landing/Hero';

import { SavedTasks } from './_tasks/SavedTasks';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">
      <WidgetGenerator
        intro={<Hero />}
        // Session and database are request data: Cache Components need them inside Suspense.
        saved={
          <Suspense fallback={null}>
            <SavedTasks />
          </Suspense>
        }
      />
    </main>
  );
}
