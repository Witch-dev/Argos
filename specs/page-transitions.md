# Feature Spec — Page transitions and loading states

**Status:** ✅ Built 2026-10-13 (checked in Chromium; not yet looked at in Firefox, Safari or a real phone).

## 1. Problem

Loading showed one line of plain text ("Loading…") and the real content then popped in, shifting everything under it. Moving between pages had no motion at all, and switching Books ↔ Community, which are the two sections of the app, felt like a hard cut.

## 2. Decisions (with the user, 2026-10-12)

- **Skeletons instead of "Loading…"**: pale placeholder shapes (lines, a row of covers, or a list of cards). Only opacity animates, so it is cheap on a weak phone. The words "Loading…" stay in the page, visually hidden, for screen readers.
- **A short fade-in** (150ms, opacity only) when a page mounts. It plays on mount only, so a refetch or a like never re-runs it.
- **A thin accent line under the header** while a page, or the first data of a query, is loading. It appears only after 250ms, so fast loads never flash it. Background refreshes (window focus) do not trigger it.
- **Keep the previous content while another filter loads** (Feed filters, Browse lists), dimmed, instead of blanking it.
- **Switching Books ↔ Community uses the same plain fade-in as every other page change.** A page-turn animation was built and tried on 2026-10-13 (first with the browser's View Transitions, then as a bending sheet cut into strips) and the user did not like it, so it was removed (`lib/pageTurn.ts` deleted).
- **Left out on purpose:** slide or zoom transitions on links, and any page-turn effect.

## 3. Design notes

- The fade-in plays on mount only (`Layout.module.css`), so a refetch or a like never re-runs it, and it respects reduced motion.
- Both section pages' code is preloaded when the tabs mount, so switching never waits on a download.
- The page-turn experiment is not kept as code. If it is ever wanted again: clone the column into strips hinged on one another, run it below the menu (z-index 5), and capture frames with a CDP screencast to judge it.

## 4. Tasks

### Frontend
- [x] `Skeleton.tsx` (lines / covers / cards), `LoadingMessage` renders it (`variant` prop).
- [x] `LoadingBar.tsx` and its use in `Layout.tsx` (first-data fetches and the Suspense fallback).
- [x] Page fade-in in `Layout.module.css`.
- [x] `keepPreviousData` on the Feed and Browse lists; dimmed while stale.
- [x] `SectionSwitch.tsx` preloads both section pages.

### Verification
- [x] Skeletons, the loading line and the kept-previous-list behaviour looked at in Chromium.
- [ ] Check the loading line on a slow connection (DevTools throttling).

## 5. Known limits
- The very first visit to a page still shows its skeleton inside the turn when its data is not cached yet.
- `LoadingMessage` is used in 47 places and now all show three grey bars by default. Where a place wants a better-shaped placeholder (a profile header, the comments list), pass `variant` or add one.
