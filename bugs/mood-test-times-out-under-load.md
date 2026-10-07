# Slow frontend tests time out when the whole suite runs

**Priority:** P2 · **Size:** S · **Area:** Frontend tests · **Found:** 2026-10-05 (during `specs/feed-redesign.md` Phase 2) · **Status:** Fixed 2026-10-07

## What happens

`Apollon/web/src/components/ReaderInsights.test.tsx` → "Quick questions in the log form … caps moods at three, clears a segmented answer on a second click, and sends everything" sometimes fails with **"Test timed out in 5000ms"** when the whole frontend suite runs (`npx vitest run`).

Run on its own (`npx vitest run src/components/ReaderInsights.test.tsx`), all 7 tests in that file pass in under 3 seconds. So the code is fine; the test is just slow and runs out of time when the computer is busy running ~380 other tests in parallel.

**Also seen (2026-10-05, feed-redesign Phase 3):** `Apollon/web/src/components/ActivityStrip.test.tsx` → "shows one tile per person, plus a "You" tile with your likes and comments" failed once in a full run ("Unable to find role=button …") and passes alone (8/8). Same cause: lots of `userEvent` steps on a busy machine. Fix both together, and look for other long `userEvent` tests while at it.

**Also seen (2026-10-06, `specs/landing-page.md`):** `Apollon/web/src/App.test.tsx` → "loads a page on first visit and renders it inside the layout" failed in 2 of 3 full runs. Its `findByText` waits only the default 1 second for the lazily loaded `NewsPage` file, which isn't enough on a busy machine. The landing page's own `HomeGate` test hit the same problem while it loaded the real lazy `LandingPage`. That was fixed by mocking `LandingPage` there, since the test only needs to know which branch `HomeGate` picks. For App.test, pass a longer `timeout` to `findByText`. The suite now has 444 tests, so this flakiness will keep growing until it's fixed.

## Why

The test clicks through a large form one step at a time with `userEvent` (each click waits for the screen to update). That adds up to several seconds on a busy machine, close to Vitest's default 5-second limit per test.

## Suggested fix

Pick one:

- Give this test more time: `it('…', async () => { … }, 15_000)`. Quickest.
- Make it faster: use `userEvent.setup({ delay: null })`, or split it into smaller tests that each check one thing (caps at three / clears on second click / sends everything).

Then run the full suite a few times to confirm it no longer fails.

## Fixed (2026-10-07)

While translating the site (`specs/languages.md`) the suite grew and these tests failed most runs. Fixed the quick way: the two slow `ReaderInsights` tests get 15 seconds (`SLOW_TEST_TIMEOUT`), and the `ActivityStrip` and `App` tests wait up to 5 seconds for their first screen instead of 1. The full suite then passed several runs in a row. If another long `userEvent` test starts timing out, give it the same treatment.
