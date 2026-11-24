import { Suspense } from 'react';

import { StartScreen } from './_tasks/StartScreen';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4">
      {/* Wide enough for two saved cards side by side; WidgetGenerator keeps the rest in COLUMN_CLASS. */}
      {/* The layout depends on the session, which is request data: Cache Components need it inside Suspense. */}
      <Suspense fallback={null}>
        <StartScreen />
      </Suspense>
    </main>
  );
}
