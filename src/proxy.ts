import { clerkMiddleware } from '@clerk/nextjs/server';

// Only attaches the Clerk session to requests: every route stays public, and guests may
// generate too. Routes decide what a signed-in user gets through `auth()`.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    // Clerk's frontend API proxy routes.
    '/__clerk/(.*)',
  ],
};
