# UX review: Books home (`/books`, the logged-in landing page)

Reviewed: 2026-10-11 · Themes: Paper, Dark · Widths: 1366 and 1280 (desktop), 900 (tablet), 375 (phone) · Readers: one with data (2 reading, 2 read, 9 want-to-read), one brand-new
Looked at: normal and empty states at 1280 in both themes, normal at 900 and 375 in Paper, the phone drawer, the header at 14 widths from 1280 down to 320, a keyboard pass (40 Tab stops), accessible names and target sizes measured in the page.
Code read: `BooksHomePage.tsx` (+ css), `AccountSummary`, `ActivityStrip`, `YearSoFarCard`, `StateMessage`, `Sidebar`.

First review with the `ux-review` skill, so this also tests the checklist. Notes on that at the bottom.

## Summary

The page itself is calm and well ordered: clear sections, one rhythm (`--space-6` between sections), good keyboard behaviour. The biggest problem is not on the page but in the shared header: between about 660 and 1000px wide the notifications bell sits on top of the "Community" tab. After that, the issues are mostly **things that disappear or get cut**: the username clipped in the right rail, the year card and goal that vanish below 1100px, cover rows cut mid-letter with no cue to scroll.

Count: 1 × P1, 6 × P2, 4 × P3. Quick wins (S): 1, 2, 3, 5, 7, 8, 9, 10, 11.

## Findings

### 1. The bell sits on top of the "Community" tab between ~660 and ~1000px: P1 · S · Rule
**Where:** the header (`layout/Header.tsx`, `Header.module.css`), at 660–1000px wide. Same overlap in every theme.
**What:** at 900px the bell button (x 537–573) overlaps the Community tab (x 445–595), covering its right edge and brushing the label. The search box starts 8px after the bell, so the three things collide in one row. At 641px the elements merely touch; at ≤640px the tabs move to their own row and it is fine. No horizontal scroll at any width.
**Why it matters:** this is a laptop window at half width or any tablet in portrait: the section switch, the app's main navigation, is partly covered by a different control, and a click on the right part of the tab hits the bell.
**Fix:** give the tabs and the bell/search group their own space (tabs on a second row from ~1000px down, or let the search collapse to an icon first). It is the same mechanism the ≤640px layout already uses, only started earlier. Filed as `bugs/header-tabs-overlap-bell.md`.
**Status:** open

### 2. The reader's name and handle are cut off at the rail edge: P2 · S · Rule
**Where:** `AccountSummary.tsx` / `AccountSummary.module.css`, right rail at ≥1100px.
**What:** a 20-character username shows as `ux_a_1791769154` and the handle as `@ux_a_17917691542`, hard-clipped with no ellipsis. The text container has no `min-width: 0`, `overflow` or wrapping rule, so a long name runs under the rail's edge.
**Why it matters:** your own name is the thing you most expect to read in full, and a clipped handle looks like a rendering bug. Display names can be longer than usernames.
**Fix:** `min-width: 0` on the text `div`, then `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on `.name` and `.username` (or allow two lines for the name). Check the same card with a long display name.
**Status:** open

### 3. "My books" and the username link in the sidebar go to the same page: P2 · S · Rule
**Where:** `Sidebar.tsx:79` ("My books") and `:133` (the username/display name). Both link to `/u/<username>`.
**What:** two adjacent-looking entries, different labels, identical destination. The second is just a raw username with a person icon.
**Why it matters:** a reader will try both and wonder what the difference is, or wonder what they missed. A menu should have one door per room.
**Fix:** decide what each is for. Either remove one, or make "My books" open the shelves part of the profile directly and relabel the other "Profile". If both stay, the username entry should say "Profile".
**Status:** open

### 4. The year card and reading goal disappear on tablet and phone: P2 · M · Judgement
**Where:** `RightPanel` hides below 1100px (`Layout.module.css`); the year numbers and goal are only rendered there.
**What:** at 900px and 375px the Books home has no "Your 2026 so far", no shelf counts, no reading goal and no "Set a goal" button. Everything else on the page remains.
**Why it matters:** those two cards are the page's sense of progress, and on a phone, which is where most reading apps are used, a reader never sees them from home. The goal is reachable from Stats, but nothing on the page says so.
**Fix:** below 1100px, show the year card and goal as a compact block near the top of the page (above Popular), or as one collapsible "This year" row. Avoid rendering both versions into the accessibility tree at once.
**Status:** open

### 5. The theme button is an almost invisible circle: P2 · S · Rule
**Where:** `ThemeMenu.tsx` / `ThemeMenu.module.css`, bottom of the sidebar (and drawer).
**What:** the swatch is filled with the theme's own background colour, with a thin `--border` outline, so in Paper it is a barely-there ring beside a clearly visible "English" select. In Dark it is equally faint. It has a good accessible name ("Theme: Paper. Change theme"), but sighted readers get no hint of what it does.
**Why it matters:** non-text controls need about 3:1 contrast against their surroundings; this is around 1.2:1. A reader looking for "how do I change the colours" will not find it.
**Fix:** use a visible icon (sun/moon or a palette) inside the button, with a `--text-muted` border; keep the swatch as a small dot if wanted. Also consider a visible label on wide screens.
**Status:** open

### 6. Cover rows are cut mid-letter with no sign that they scroll: P2 · M · Judgement
**Where:** `BooksHomePage.module.css` `.covers` (horizontal `overflow-x: auto`), "Popular" and "Want to read".
**What:** 12 popular books are loaded but 6 show; the 7th is sliced through the title ("Ni…", "Ei…") and "7 r…". On touch this reads as a scroll hint. On a mouse there is no visible scrollbar, arrow or fade in the screenshots, so the cut looks like a bug and the other six are easy to miss. Popular has no "See all" link while "Want to read" does.
**Why it matters:** half the "Popular" content is invisible to desktop readers, and a clipped word looks careless.
**Fix:** either wrap into a grid using the existing pattern (`repeat(auto-fill, minmax(9rem, 1fr))`, show one or two rows), or keep the row and add left/right arrow buttons plus a fade on the cut edge; give "Popular" a "See all" like the other row.
**Status:** open

### 7. Empty states give no next step and sit too far from their heading: P2 · S · Judgement
**Where:** `StateMessage.module.css` (`padding-block: var(--space-4)`) used by `WantToRead` and `JournalPreview`.
**What:** "Nothing on your want-to-read shelf yet." and "Your journal is empty. Log a book you started or finished and it appears here." state the fact but not what to do. The text also lands about 60px under its heading (h2 margin + paragraph margin + 1rem padding), roughly three times the gap the covers get when the shelf has books, so it looks detached.
**Why it matters:** a new reader sees this page first, and it is mostly "nothing yet". The empty page is the onboarding.
**Fix:** add a one-line action ("Find a book to add" linking to search, or focusing the search box), and remove the doubled spacing (drop the paragraph's margin inside `.message`).
**Status:** open

### 8. "Reading now: 2 · Want to read: 9" wraps and strands the "9": P3 · S · Judgement
**Where:** `YearSoFarCard.tsx`, string `sections.yearCard.shelves`.
**What:** at the rail's 15rem width the line breaks right before the final number, leaving "9" alone on its own line. German and French will be longer.
**Fix:** two short lines (one stat per line), or `white-space: nowrap` per stat so the break happens at the "·".
**Status:** open

### 9. "Open journal" is offered twice, and the count badge on "You" means nothing: P3 · S · Judgement + Rule
**Where:** `YearSoFarCard.tsx` ("Open journal") and `BooksHomePage.tsx` Journal header ("Open journal"); `ActivityStrip.tsx:148` (`.count`).
**What:** (a) two links with identical text going to the same page, within one screen on desktop. (b) The dark "5" on the "You" tile is the number of stories, but nothing says so; the accessible name reads "5 You".
**Fix:** (a) drop the card's link, since the Journal section is right there. (b) add visually hidden text or an `aria-label` through `t('…')`, e.g. "5 reading updates".
**Status:** open

### 10. Journal titles carry three emphases at once: P3 · S · Judgement
**Where:** `JournalEntryRow` (shared with the Journal page; check there before changing).
**What:** the book title is bold, italic and underlined in serif, and in the text colour, while every other link on the page ("See all", "Open journal", "Read the review") is the accent colour with a plain underline. The title therefore looks like a different kind of object, and "bold italic underline" is a lot of shouting.
**Fix:** pick one: accent colour plain underline like the other links, or bold only.
**Status:** open

### 11. Phone: some links are smaller than a thumb, and the drawer has no scrim: P3 · S · Rule + Judgement
**Where:** `JournalEntryRow` links; `Sidebar.module.css` drawer at ≤640px.
**What:** journal book-title links are 24px tall and "Read the review" is 16px tall at 375px (the section header links already get `min-height: 2.75rem`, these don't). The open drawer shows the page behind at full strength with only a hairline between, so what is menu and what is page is unclear; the first item also starts about 100px below the header.
**Fix:** give those links the same 2.75rem min-height treatment; add a dim scrim behind the drawer that closes it on tap; start the list near the top.
**Status:** open

## Looked fine

- **Keyboard:** every one of the 40 Tab stops shows a 2px accent outline; a "Skip to content" link exists; order is header, sidebar, content. Section tabs behave as a real tablist.
- **Names and structure:** logo has alt text, the search is a labelled searchbox, regions are named, one hidden h1 then one h2 per section, icon buttons have accessible names.
- **Rhythm:** sections are consistently `--space-6` apart, headings are the same size, cards share one style; Dark behaves like Paper except for finding 5.
- **Phone:** the header fits at 320–480px without horizontal scroll; drawer items are 44px tall; section-header links meet the target size.

## Not verified

- **"0 books read" while the Journal says "Finished" twice.** The reader's two Read logs were created through the API without a finish date, which probably explains it, but the Journal shows them as finished. Worth reproducing through the UI: if a log marked Read with no date is dropped from the year count, that is a bug to file.
- Not covered: the Community tab, Sepia, very long book titles, the German layout, and the logged-out landing page.

## Notes on the skill (first run)

- The code pass was cheaper and surer than expected: the accessible-name and target-size measurements found nothing new beyond the screenshots, but confirmed finding 3 and 11.
- `fullPage` screenshots distort sticky sidebars (the nav looked pushed down). Capture the **viewport** at the real first-view size for layout judgements; keep fullPage only for content order. Worth adding to `SKILL.md` Phase 2.
- The "hardcoded date format" grep was not run here; it belongs to the site-wide audit in FUTURE-IDEAS.
