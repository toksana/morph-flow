import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';

import { AuthControls } from '@/components/auth/AuthControls';
import { SignedInBrand } from '@/components/auth/SignedInBrand';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Morph Flow',
  description:
    'Describe your day in plain language and watch your interface build itself — instant task lists, habit trackers, and schedules with zero clutter.',
};

// `cover` lets the page reach under the iPhone home indicator; without it the
// `env(safe-area-inset-*)` values the dock relies on are always 0.
export const viewport: Viewport = {
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          {/* Floats over the page so the centred generator layout keeps its full height. */}
          <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
            {/* Session is request data: Cache Components need it inside Suspense. */}
            <Suspense>
              <SignedInBrand />
              <div className="ml-auto">
                <AuthControls />
              </div>
            </Suspense>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
