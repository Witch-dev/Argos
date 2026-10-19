# UX review — Header, sidebar and right rail (after the 2026-10-12 layout changes)

Reviewed: 2026-10-12 · Themes: Paper, Dark · Widths: 1366, 1000, 375 (and a measured header sweep 1600 → 320) · Reader: logged in, with data (3 reading, 2 want-to-read, follows alice_reads) and brand-new (empty)
Screenshots looked at: Books and Community at 1366 / 1000 / 375, Books empty reader, Community in Dark, bottom of the Community feed, Log progress and Write modals, keyboard focus after 12 Tabs. Spec: `specs/rail-content.md`.

## Summary
The new layout works: the menu sits at the top, the Log progress / Write button is the one clear primary action, the rails stay put down to the footer, and empty cards disappear instead of showing empty boxes. The account block in the header broke two things: the bell now sits on the Community tab from 1250px up, and on a phone the header wraps to three rows and covers the first heading. Fix those, and the missing link name, first; all three are small CSS or attribute changes.

## Findings

### 1. Phone header wraps to three rows and the tabs cover the page's first heading — P1 · S · Rule
**Where:** `Header.module.css` (`@media (max-width: 640px)`), `AccountSummary` in `Header.tsx`; 375px and 320px.
**What:** with the avatar added, hamburger + logo + bell + search (9rem) + avatar no longer fit on one row. The right group wraps under the logo, so the bar is hamburger / bell + search + avatar / tabs. The bar is a fixed 5.5rem tall, so the tabs hang below it and cover "Your reading" (only a "Y" shows).
**Why it matters:** the first heading of every page is hidden on a phone, and the header looks broken.
**Fix:** hide the account link at 640px and below (the drawer already has "My books" / the profile link), or shrink `.search` to 7rem there. Hiding is the safer one. Re-measure at 375 and 320 afterwards.
**Status:** fixed 2026-10-12 (account link hidden at 640px and below; header is one row at 375, re-measured)

### 2. The account block makes the bell overlap the Community tab from 1250px — P2 · S · Rule
**Where:** `AccountSummary.module.css` (`.name`, `max-width: 8rem`), `Header.module.css` (`.search`, `.right`).
**What:** measured at 1600, 1366, 1280 and 1250: the bell's left edge is about 15px left of the tabs' right edge (at 1366: bell starts at 812, tabs end at 827.5). Below 1250, where only the avatar shows, the gap is about 120px. The shell is a fixed 76.5rem wide, so the overlap is the same at every width above 1250.
**Why it matters:** the bell covers the corner of the Community tab and part of its click area, and it reads as a layout bug in the first view.
**Fix:** take the name's `max-width` from 8rem to 5.5rem (leaves about 24px), or drop the name and keep the avatar only (the sidebar already shows the username in Community). Re-run the width sweep and confirm the bell clears the tabs by at least `--space-3`.
**Status:** fixed 2026-10-12 (name max-width 8rem → 5.5rem; bell clears the tabs by 24px at 1250–1600)

### 3. The account link has no accessible name below 1250px — P1 · S · Rule
**Where:** `AccountSummary.tsx`, `AccountSummary.module.css` (`.name { display: none }`).
**What:** a reader without an avatar image gets the letter placeholder, which is `aria-hidden`. Below 1250px the name is `display: none`, so the link has no text at all and a screen reader announces just "link".
**Why it matters:** an unlabelled control (WCAG 4.1.2).
**Fix:** add `aria-label={name}` to the `Link`. The avatar target is also 32px tall; if the link stays on phones, give it `min-height: 2.75rem`.
**Status:** fixed 2026-10-12 (`aria-label` on the link)

### 4. "People you may know": the Follow button runs into the name and clips the handle — P2 · S · Rule
**Where:** `SuggestedAccounts.module.css` (`.row`), in the 15rem right rail. An existing issue, more visible now that the rail is busier.
**What:** names and `@handles` are cut off by the button with no ellipsis ("ben_writes" touches the button; "carmen_bo", "@ben_writes" are clipped).
**Why it matters:** two readers can't be told apart when the name is cut mid-word, and the button looks glued to the text.
**Fix:** let the first column truncate with `text-overflow: ellipsis` plus a `title` with the full name, keeping `gap: var(--space-2)`; or put the button under the name in the rail.
**Status:** fixed 2026-10-12 (`UserCard` name and handle truncate with an ellipsis and a `title`; Follow button no longer shrinks)

### 5. Two controls do the same thing in Books: the "+" tile and the "Log progress" button — P3 · S · Judgement
**Where:** Books home, "Your reading" strip and the sidebar button.
**What:** both open the same modal, and on a wide screen they are one glance apart.
**Why it matters:** duplicates make a reader wonder whether they differ. Mild, because the tile is part of the Readings strip pattern shared with Community.
**Fix:** leave as is and decide after using it; or keep only the tile in Books.
**Status:** no change needed, re-checked 2026-10-19: the sidebar's Log progress button is gone since the shelf refresh; the "+" tile is the only one.

### 6. A "Currently reading" book with no page shows only a title — P3 · S · Judgement
**Where:** `RailCards.tsx`, `CurrentlyReadingCard`.
**What:** "Brave New World" has no bar and no line, while its neighbours do, so it looks unfinished.
**Why it matters:** this card is the quick way to see progress; a row that offers nothing reads as a gap.
**Fix:** when there is no page, show a muted "Add your page" line (a new translated string) that links to the book. Optional.
**Status:** fixed 2026-10-19: a reading without a page shows a muted "Add your page" (`rightPanel.noPage`, five languages); the row opens the book, whose log form has the page field.

### 7. The Books rail is taller than a laptop screen, so Popular is out of sight — P3 · S · Judgement
**Where:** `RightPanel` in Books at 768px tall.
**What:** Currently reading, Year, Goal, Up next and Popular add up to more than the viewport. The rail scrolls inside itself with a thin scrollbar and no cue, so Popular (the last card) is easy to miss and the Up next covers sit right at the fold.
**Why it matters:** the least personal card is the one hidden, so this is mostly fine, but a reader won't know the rail scrolls.
**Fix:** limit Popular to 3 books and make the Up next covers smaller (about 100px each, bigger than the Currently reading covers). Optional.
**Status:** fixed 2026-10-19: on Books home the rail leaves out Up next, which repeated the page's want-to-read shelf, and Popular shows 3 books (was 4). At 1366×768 the rail went from 1528 to 1260px; it still scrolls on its own below the goal card, which is accepted.

### 8. Headings in the Community rail do not match — P3 · S · Judgement
**Where:** `SuggestedAccounts.module.css` (`.heading` is `--text-muted` with a bigger top margin) vs `RightPanel.module.css` (`.heading`, full text colour).
**What:** "People you may know" is grey while "My Book Clubs", "Lists" and "Popular on Winged Words" are dark.
**Why it matters:** it reads as a less important block, which is probably not intended.
**Fix:** use the rail's `.heading` style for all of them.
**Status:** no change needed, re-checked 2026-10-19: every rail heading now shares one style (`.panel h2` in `RightPanel.module.css`).

## Looked fine
- Menu fixed at the top with Log progress / Write as the single filled action; nothing else in the left column competes with it.
- Rails stay pinned to the bottom edge when the footer scrolls in; no lift. The footer sits in the feed column with matching divider lines.
- No horizontal page scroll from 1600 down to 320 (document width is the viewport minus the scrollbar).
- Both modals open from the sidebar, close with Escape and sit above the rails; focus ring on the sidebar links is visible.
- A new reader sees no empty boxes: Currently reading and Up next are simply absent, and Popular still fills the rail.
- Dark theme: new cards and the account block keep their contrast.
- Not checked: Sepia, German text length in the new strings (the French "Enregistrer ma progression" in the 15rem button is the one to look at), and the phone drawer's button.
