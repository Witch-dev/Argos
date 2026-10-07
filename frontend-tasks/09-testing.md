# 09 — Frontend Testing Pass

**Status:** ✅ Done

## Scope

Per SPEC.md §8: Vitest + React Testing Library for components, no E2E framework required until Phase 2 stabilizes core flows.

- Vitest 2 + RTL 16 configured (`vite.config.ts` test block or a separate `vitest.config.ts`, jsdom environment, `@testing-library/jest-dom` matchers).
- A `test` npm script and CI wiring if/when this repo gets a CI pipeline (backend already has one per `backend-tasks`).
- Coverage priorities, in order:
  1. `AuthContext`/`useAuth` — login/logout/token persistence, the thing everything else depends on.
  2. `ProtectedRoute` — redirect behavior for unauthenticated access.
  3. Form validation on register/login/log-creation (the places user input meets backend constraints).
  4. Rendering logic with real edge cases: missing cover, missing description, empty search results, empty feed, private list access.
- Not chasing 100% coverage — this is about the pieces that are easy to silently break (auth state, protected routing, form validation) not exhaustive snapshot testing of every component.

## Depends on

Tasks 01–08 having produced components to test. In practice this can run incrementally alongside each task rather than strictly after all of them — whichever is more natural when we get here.

## Progress

**Done.** Vitest configured via `vitest/config`'s `defineConfig` in `vite.config.ts` (`environment: 'jsdom'`, a setup file), React Testing Library + `@testing-library/user-event` + `jest-dom` matchers. 19 tests across 7 files, all four priority areas covered:

1. `AuthProvider`/`useAuth` (`src/auth/AuthContext.test.tsx`) — starts anonymous with no stored token, becomes authenticated and persists the token after a mocked login, clears both state and the stored token on logout.
2. `ProtectedRoute` (`src/auth/ProtectedRoute.test.tsx`) — loading state, redirect-to-`/login` when unauthenticated, renders children when authenticated (auth state mocked via `vi.mock('./useAuth')`, no real provider needed for this one).
3. Form validation (`src/lib/passwordPolicy.test.ts`) — pulled `getPasswordError`/`PASSWORD_HINT` out of `RegisterPage.tsx` into their own module specifically so this could be a plain unit test instead of a full form-render test; covers all five rules plus a password that satisfies all of them.
4. Edge-case rendering: `BookCover` (cover image vs. the placeholder box, SPEC.md §8's graceful-degradation rule), `BookDetailPage` (`description: null` → "Description unavailable.", empty reviews), `SearchPage` (no query yet vs. zero results), `FeedPage` (empty feed's "follow some readers" nudge).

Not covered, deliberately: private-list-access — that's a server-side rule already verified live via curl in task 06 (`BookListService.GetByIdAsync` returns `NotFound` for a private list to a non-owner), not frontend rendering logic worth a component test.

Notes:
- **Upgraded to Vitest 5 / `@testing-library/react` 16, not the SPEC.md-pinned "Vitest 2.x"** — installing 2.x pulled in a vulnerable transitive `esbuild`/`vite` (`npm audit`: 2 critical, 1 high, 3 moderate, all dev-server-only path-traversal/arbitrary-request CVEs in old `vite`/`esbuild`/`@vitest/mocker`). Same "re-check for newer stable at setup time" call as task 01's version bump — `npm audit` now reports 0 vulnerabilities. React Testing Library landed on exactly the spec'd **16.x**.
- Without `test.globals: true` in the Vitest config, Testing Library's automatic `afterEach(cleanup)` never registers on its own — the first pass at this suite had renders from earlier tests silently piling up in the same `document.body`, causing "found multiple elements" failures in tests that ran fine in isolation. Fixed by calling `afterEach(cleanup)` explicitly in `src/test/setup.ts`. Worth remembering if a future test mysteriously finds duplicate elements: check cleanup wiring before assuming the component is at fault.
- Every test file imports `describe`/`it`/`expect`/`vi` explicitly from `'vitest'` rather than relying on injected globals, to match this project's `strict: true` TypeScript setup without needing to add `"types": ["vitest/globals"]` to `tsconfig.app.json`.

Verified: `npm test` (== `npx vitest run`) — 19/19 passing. `npm run build` + `npm run lint` still clean with the test files present.
