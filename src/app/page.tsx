import { Suspense } from 'react';

import { StartScreen } from './_tasks/StartScreen';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">
      {/* The layout depends on the session, which is request data: Cache Components need it inside Suspense. */}
      <Suspense fallback={null}>
        <StartScreen />
      </Suspense>
    </main>
  );
}
