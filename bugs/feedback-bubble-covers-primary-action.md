# On a phone, the floating feedback button covers the end of a page's main button

**Priority:** P3 · **Size:** S · **Area:** Frontend, phone, feedback button · **Found:** 2026-10-23 (design review of `specs/stronger-clubs.md` Phase 3 screenshots) · **Status:** Open

## What happens

At 375px on a club page, the floating feedback button (bottom right, `specs/feedback-button.md`) sits over the right end of "Log progress" in the "What's next" card when the page is scrolled so the card is at the bottom of the screen. Any full-width button that ends near the bottom right can be partly covered the same way.

## Why it matters

The covered button is the page's one primary action. The tap still works on the visible part, but it looks broken and the feedback button can catch taps meant for it.

Seen again 2026-10-23 (specs/stronger-clubs.md Phase 4): on the club page at 375px in Dark, the bubble sits over the end of the voting line under "Suggestions" ("Rank the books in the order…") and clips it. Bottom padding alone won't fix that one, since it isn't at the end of the page.

## Fix

Give the page column bottom padding at phone width equal to the floating button's height plus its offset (so nothing can end up under it at the end of a page), or make the feedback button smaller or tucked into the sidebar drawer on a phone. Check the club page, a book page and the journal at 375px.
