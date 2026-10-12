# The bell covers the "Community" tab on tablet-width windows

**Priority:** P1 · **Size:** S · **Area:** Frontend, layout · **Found:** 2026-10-11 (`ux-reviews/books-home.md`, finding 1) · **Status:** Fixed 2026-10-11 (Apollon 1e90c48)

## What happens

Between about 660px and 1000px wide (a half-width laptop window, a tablet in portrait), the notifications bell in the header is drawn on top of the "Community" section tab. At 900px the bell spans x 537–573 and the tab spans x 445–595, so the tab's right edge and part of its label are covered, and the search box starts 8px after the bell. Clicking the right part of the tab hits the bell.

At 641px the elements only touch, and at ≤640px the tabs move to their own row, so phones are fine. No horizontal scroll at any width. Same in every theme.

## Why

The header is one row of logo, centred tabs and a right-hand group (bell + search). Below the 1100px rail breakpoint the centred tabs keep their position but the right group is pushed left by the narrower window, and nothing moves the tabs to a second row until 640px.

Widths measured (tabs right edge vs bell left edge): 1100px: 695 vs 737 (fine); 1000px: 645 vs 637 (overlap begins); 900px: 595 vs 537; 700px: 495 vs 337.

## Suggested fix

Start the existing ≤640px behaviour (tabs on their own row) at about 1000px, or let the search collapse to an icon first. Check `Header.module.css` for the media query and re-measure at 1000, 900, 760 and 660px in a browser. Also look at it with a longer translation of the tab labels (German).

## Fix

The header uses the two-row layout from 1100px down (it used to start at 640px). Measured at 16 widths between 1366 and 320px with real bounding boxes: no overlaps, and the bar stays 88px tall down to 375px.
