# A new page opens at the old page's scroll position

**Priority:** P1 · **Size:** S · **Area:** Frontend, navigation (every page)
**Found:** 2026-10-20, checking the landing page's "What readers are into this week" showcase in the browser

## What happens

Following a link keeps the window's scroll position, so the next page opens partway down (or at its bottom, if it's shorter) instead of at its top. Measured at 1280, signed out:

- Landing page scrolled to the showcase (`scrollY` 2432) → click a popular book → The Hobbit's page opens at `scrollY` 1735, its bottom; its title and cover are off screen.
- Landing page → click a recent review → the review page opens with its cover cut off under the top bar.
- Inside the app: The Hobbit's page scrolled to the footer (1735) → **Privacy policy** → `/privacy` opens at 1735 of 1800.

Back keeps the old position too (1735 on returning to the book page), which is the one case where that's right.

## Where to look

`web/src/main.tsx` uses `<BrowserRouter>`, which has no scroll handling; React Router's `<ScrollRestoration>` works only with a data router (`createBrowserRouter`). Nothing else in `web/src` calls `scrollTo` on navigation.

## Fix

A small `ScrollToTop` inside the router: on a change of `location.pathname`, when `useNavigationType()` isn't `POP` (so Back and Forward keep the browser's own restoring), `window.scrollTo(0, 0)`; leave URLs with a `#hash` alone. A query-string-only change (a tab or a filter) keeps its place. Test it with a Vitest render of two routes, then check the three cases above in the browser.

## Fixed 2026-10-20

`ScrollToTop` (`web/src/components/ScrollToTop.tsx`, inside `<BrowserRouter>` in `main.tsx`) scrolls to the top when the path changes, unless it's Back/Forward, a `#hash` link or a query-string-only change. In the browser at 1280, signed out: landing at 2482 → The Hobbit opens at 0; landing at 2772 → a review opens at 0 with its cover in view; The Hobbit at its footer (1835) → `/privacy` opens at 0, and Back returns to 1835. Test: `ScrollToTop.test.tsx`. Apollon 1ad85e3.
