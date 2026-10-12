# The header wraps to a third row at 320px wide

**Priority:** P3 · **Size:** S · **Area:** Frontend, layout · **Found:** 2026-10-11 (width sweep during the Books home fixes, `ux-reviews/books-home.md`) · **Status:** Won't fix (2026-10-12). 320px is a first-generation iPhone SE or a very narrow split window, the header fits from 360px up, and two attempted fixes changed nothing. Reopen if a real reader reports it.

## What happens

At a viewport 320px wide (an iPhone SE of the first generation, or a narrow split window) the header does not fit two rows: the menu button and logo are on row 1, the bell and search move to row 2, and the Books/Community tabs to row 3, which hangs below the 88px bar (the lowest element ends at 132px). From 360px up it fits.

## Why

Row 1 holds the menu button (44px) and logo (about 47px) with a 12px gap, then the bell (44px) and search (9rem = 144px). That is about 299px, and the row has 288px (320 minus the 16px padding either side), so the right group wraps. The tabs are also 150px each, 304px together, which is wider than the row.

## Suggested fix

Let the search shrink first (a flex-shrink on `.search` with `min-width: 0`, and a smaller flex-basis on `.right` so it wraps later), and let the tabs be `flex: 0 1 150px`. Two attempts at this were made and reverted on 2026-10-11 because they changed nothing at 320px: the wrap decision uses the group's base size, so the basis has to go below the content size, which needs checking at 360, 375 and 414px too. Verify in a browser with the width sweep from `ux-reviews/books-home.md`.
