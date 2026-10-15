# UX review — Top bar, right side (search, suggestions, bell, account)

Reviewed: 2026-10-14 · Themes: Paper, Dark · Widths: measured sweep 1600 → 320 (17 widths), screenshots at 1280, 900, 641 · Reader: logged in, display name "Alexandra Montgomery-Whitfield" (long) and a plain 11-letter username
Screenshots looked at: header at 1280 in Paper and Dark, suggestions open at 1280 and 900. The suggestions list was not re-captured at 375 (the live search returned nothing in time); the earlier phone capture of the 2026-10-14 suggestions work was fine.

## Summary
The right side is crowded and the suggestions list does not line up with anything. The search box is 11rem, but the list under it is 22rem and hangs 176px to its left, over the Community tab. The account name is cut by an ellipsis at 5.5rem, so even a plain username like "wingedwords" shows as "wingedw…". The biggest thing to fix is the list's alignment; the name is the quickest win.

## Findings
### 1. The account name is cut in half, for ordinary names too — P2 · S · Rule
**Where:** `AccountSummary.module.css` `.name` (`max-width: 5.5rem`), shown from 1250px.
**What:** the name gets 88px. "wingedwords" is cut to "wingedw…"; "Alexandra Montgomery-Whitfield" (251px) to "Alexandr…". There is no `title`, so the full name is not reachable on hover. The 5.5rem cap was set on 2026-10-12 to keep the bell clear of the tabs.
**Why it matters:** a reader's own name looks broken. A name cut mid-word reads as a bug, and the reader can't see the rest.
**Fix:** raise the cap to `7.5rem` (120px). Measured gap between the Community tab and the search box is 76px at 1250 and 91px at 1280, so this uses 32px of it and leaves 44px at the narrowest width. Add `title={name}` on the link so a longer name is readable on hover. (An alternative is to drop the name and keep the avatar at every width, as it already is below 1250px; that frees room to widen the search. Judgement, say if you prefer it.)
**Status:** open

### 2. The suggestions list is not aligned with the box, and covers the Community tab — P2 · M · Judgement
**Where:** `HeaderSearch.module.css` `.list` (`right: 0; width: 22rem`, positioned from `.search`).
**What:** the list is anchored to the input's right edge and is 352px wide against a 176px box, so it starts 176px to the left of the box (128px on the ≤1100px layout). At 1280 it spans 700→1052 and sits over the Community tab (tabs end at 785). It lines up with neither the box nor the right rail below it. Below 1100px it covers the second row of tabs.
**Why it matters:** the dropdown looks detached from the field that opened it, and it hides a tab. This is what the review request called "not aligned with the search box".
**Fix:** anchor the list to the right column instead of the box: `position: relative` on `.right`, list `right: var(--space-4)` and `width: calc(17rem - 2 * var(--space-4))` so its edges match the right rail under it, and no tab is covered. Where the rail is gone (≤1100px) keep `width: min(20rem, 100vw - 2 * var(--space-4))`, right-aligned to the bar's gutter. A second option is to widen the box itself on focus, but there is only about 90px of room before it reaches the tabs.
**Status:** open

### 3. The search box jumps 95px sideways at 1250px — P3 · S · Judgement
**Where:** `AccountSummary.module.css` (`@media (min-width: 1250px)` shows the name).
**What:** measured box position: 846→1022 at 1250px, 941→1117 at 1249px. The name appearing pushes the whole cluster left.
**Why it matters:** resizing a window, or moving between a laptop and a monitor, makes the search box jump. It also means the box has two different positions relative to the rail.
**Fix:** if finding 1 is done with the name always hidden, this goes away. If the name stays, reserve its width from the start (a fixed-width `.name` block) or show it from 1100px, where there is already room (search→bell gap is stable there).
**Status:** open

## Looked fine
- Bar height is a constant 88px at all 17 widths; no horizontal scroll from 1600 down to 320.
- At 1100px and below the bar is two rows (logo and search above, tabs below). The sweep's "search overlaps tabs" flags for 641–900px are rows, not a collision.
- Bell, divider and avatar spacing; the bell clears the tabs at every width from 1250 to 1600.
- Account link has an accessible name (`aria-label`) when the name is hidden.
- Combobox roles and keyboard (covered by the Header tests; Tab order was not re-walked in this pass).
- Dark theme: placeholder, border and the focus ring are readable.
