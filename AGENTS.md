# Morph Flow: notes for AI agents

Read the README first, especially "How it works" and "Adding a widget". These notes add only the rules that are easy to break.

## Boundaries

- `src/core` must stay platform-agnostic. It will become a package shared with a React Native app, so it can't import React, Next.js, the DOM, `node:*` or app code. ESLint enforces this (`eslint.config.mjs`).
- Server code takes its dependencies as arguments. `createGenerateHandler` receives `identify`, `saveUser` and `checkRateLimit`, and `src/app/api/generate/route.ts` only wires in Clerk, Neon and Upstash. Keep new side effects at that edge.

## Streaming widgets

- Components render a _partial_ widget. A pure view function in `src/core/widgets/*.view.ts` turns it into something renderable.
- Don't fill in a field the model hasn't written yet with a guessed value: it shows up mid-stream and then changes. Hide the field until it's complete and valid instead (see `completeDueDate` and `completePriority` in `taskList.view.ts`).

## Tests

- Tests sit next to the source (`foo.ts` → `foo.test.ts`), in Arrange–Act–Assert form, with data from the `@faker-js/faker` factories in `src/core/test/factories`.
- No test calls the real model. Use `src/server/test/mockLanguageModel.ts` for the handler and the mock stream server in `e2e/support` for Playwright.

## Before you finish

Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm format:check`. Run `pnpm test:e2e` too when a change touches the generator UI. Don't read `.env*` files: they hold real credentials. `.env.example` lists the variable names.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
