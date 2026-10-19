# UX review — The shell and shared pieces (found across the Phase 4 sweep)

Reviewed: 2026-10-18 · Themes: all five (Paper, Dark at both widths; White, Warm Gray, Sepia as contact sheets of eight pages) · Widths: 375, 1280 · Reader: logged in, with data (seeded `sw_mveb1frt`: 16 read in 2026, 3 reading, 7 want to read, 1 did not finish, a goal of 30, two lists, two clubs, five follows) · Apollon at `be32e1c` (dev server)
Screenshots looked at: Books home, Feed, Journal, Stats, a list, Browse lists, Search, Clubs, a club, Settings (all five tabs), Landing, at the top and scrolled. Keyboard pass with a Tab-walk script at 375 Dark (Books home, Journal, Stats) and 1280 Paper (Feed, a list, a club, Settings), listing each stop's name, size, focus ring and whether the header covers it.

Findings that are not one page's: the shell (header, drawer, rail) and shared pieces (`Shelf`, `PillButton`, `BookCover`). The page files in this sweep point here instead of repeating them.

## Summary

The five themes hold: no missing token, no unreadable text, the shelf and raised cards read in all of them. One accessibility fault runs through every page on a phone: the closed menu drawer still takes nine Tab presses before the page starts. Second: the selected pill (Shelf | Details, Books | Authors, the settings tabs, Browse's sections) differs from the others only by its colour.

## Scores

Not scored on its own: the shell's share is in each page's score.

## Findings

### 1. On a phone, the closed menu drawer is nine invisible Tab stops on every page — P1 · S · Rule
**Where:** `layout/Sidebar.tsx:54`, `Sidebar.module.css:108–117` (the drawer is `transform: translateX(-100%)` when closed, nothing else).
**What:** at 375, Tab goes menu button, logo, Books, search, bell, then Home, Journal, Stats, Lists, My books, Settings, Log out, theme and language: nine stops on links that are off the screen, with their focus ring invisible, before the first thing on the page.
**Why it matters:** a keyboard or switch user on a phone (or a narrow desktop window, or 200% zoom) loses track of focus for nine presses on every page (WCAG 2.4.7 focus visible, 2.4.11 focus not obscured).
**Fix:** when the drawer is closed below 640px, make it `inert` (or `visibility: hidden` after the closing transition, `visible` at once on open); keep it as it is from 641px up. Re-run the Tab walk: after the bell, the next stop should be the page's first control.
**Status:** fixed 2026-10-18: below 640px the closed drawer is also `visibility: hidden` (after its slide out), so it leaves the Tab order. Tab walk at 375: after the bell, the next stop is the page.

### 2. The selected pill differs from the others only by colour — P2 · M · Rule
**Where:** `PillButton` / `Pill` selected state: Journal and a list's Shelf | Details, Search's Books | Authors, Stats' Books | Pages, Browse lists' sections, the Settings tabs.
**What:** selected is green text on the green wash; unselected is ink on sunken. In Paper and White the two backgrounds are close in lightness, so "Details" (unselected, darker) can read as the chosen one at a glance; nothing but hue tells them apart. Screen readers are fine (`aria-pressed` / `role="tab"`).
**Why it matters:** DESIGN.md's Never-Alone Rule (meaning never by colour alone) and the Squint Rule; a colour-blind reader has to guess which view they're in.
**Fix:** the change Phase 3 left for Phase 4: two-or-three-way view switches become the segmented control (a sunken track with a raised selected segment, as the header's Books | Community), which differs by shape and shadow; keep pills for filters and tags, and give a selected filter pill a drawn check or a 600 weight as well as the wash.
**Status:** fixed 2026-10-18: a shared `Segmented` control (sunken track, raised selected segment) for Journal and a list's Shelf | Details, Search's Books | Authors, Stats' Books | Pages, a discussion's Top | New, Browse lists' sections and the Reviews/Writings sub-tabs (sharing the width on a phone). Filters and tags stay pills (their selected state is already 600 weight). The Settings tabs stay pills.

### 3. A row shelf that happens to fit exactly hides the rest with no cue — P2 · M · Rule
**Where:** `Shelf.tsx` `layout="row"` (`.scroller`); seen on Books home "Your want-to-read" at 1280.
**What:** seven books, five shown, the fifth ending flush with the column; books six and seven are off to the side with no peek, no arrow and no "See all" (that link only appears above 8). `books-home.md` #6 had added arrows to cover rows (`ScrollRow`); the Shelf rows dropped them.
**Why it matters:** a reader at 1280 doesn't know two books are on the shelf; there is no scrollbar to see on Windows until hovered.
**Fix:** give `Shelf` the same left/right arrow buttons as the Readings strip when the row overflows (hidden on a phone, where the half-cover peek does the job), or size the row so a partial cover always shows. On Books home also show "See all" whenever the shelf scrolls, not only above 8.
**Status:** fixed 2026-10-18: row shelves have a round arrow at each end while they can scroll that way (mouse only, hidden on a phone; a keyboard reaches each book by Tab); Books home shows "See all" whenever there is a want-to-read book, to `?shelf=WantToRead`. The unused `ScrollRow` was removed.

### 4. The rail repeats what the page already shows — P3 · M · Judgement
**Where:** `RightPanel.tsx`; Stats (the goal and "16 books read" three times on one screen: the page's goal card and tiles, the rail's year card and goal), Clubs ("Your clubs" and the rail's "My Book Clubs", the same two clubs), Books home ("Cien años de soledad" in the strip, the rail's Currently reading and the journal preview).
**Why it matters:** a quiet reading room says a thing once; on Stats the rail is pure repetition.
**Fix:** let a page tell the rail which cards to leave out: Stats hides the year and goal cards, Clubs hides My Book Clubs (the rail then shows what's left, or Popular).
**Status:** fixed 2026-10-18: the rail leaves out the year and goal cards on Stats and "Your clubs" on the Clubs pages. Kept on Books home: the strip, Currently reading and the journal preview each have their own job.

### 5. Titles break in the middle of a word in narrow places — P3 · S · Rule
**Where:** `BookCover` cloth fallback ("Hamle / t", "Pirane / si" on the Feed at 375, `BookCover.module.css:69`); Shelf captions at 375 ("Metamorphos / is" on Journal's three-across grid, `Shelf.module.css:272` `overflow-wrap: break-word`).
**Fix:** cloth cover: `hyphens: auto` with the page `lang`, and a smaller title size in thumbnail slots (or only the initial, as the club card does); captions: `hyphens: auto` before `break-word`, so a long word hyphenates where the language allows.
**Status:** partly fixed 2026-10-18: cloth-cover titles hyphenate (`hyphens: auto`). Shelf captions already asked for hyphens; where the browser has no hyphenation dictionary (headless Chromium on Windows) a long word still breaks without a hyphen. Kept as is (user, 2026-10-18): tested in this machine's Chrome 155 and Edge 155 and the screenshot browser, none hyphenates English (Windows Chrome downloads its dictionaries separately); phones (Chrome on Android, Safari on iOS) do, and captions only break at phone width. If it shows on a real phone, add soft hyphens with a per-language pattern library.

### 6. The header's search placeholder ends in two dots — P3 · S · Rule
**Where:** `layout/HeaderSearch.tsx`, `nav.searchBooksPlaceholder` ("Search books…", a real ellipsis in all five languages).
**What:** zoomed in, the placeholder reads "Search books.." on every page and theme: the ellipsis glyph draws as two dots in the field (Public Sans, or its fallback).
**Fix:** check which font draws the placeholder (`::placeholder` may fall back to a face without U+2026); give the placeholder the interface font explicitly or check the font file's unicode range. Leave out the ellipsis if it can't be drawn properly.
**Status:** fixed 2026-10-18: the clear cross's room was reserved even in an empty field and clipped the third dot; an empty search field now gives the cross no width (`index.css`).

### 7. The Books | Community switch is 40px tall — P3 · S · Rule
**Where:** `SectionSwitch.module.css`; Tab walk: "Books" 162×40 at 375, 128×40 at 1280.
**Fix:** 44px segments (the track grows by 4px), or a 44px hit area with the drawn segment kept at 40.
**Status:** no change needed 2026-10-18: the segments already have a 48px tap area (a `::before` reaching the track's edges); the walk measured the drawn 40px.

## Looked fine

The five themes on eight pages (tokens complete, text and stars readable, shelves and cards visible in White too); focus rings on every stop in the Tab walk; the skip link first; 44px sidebar rows, header buttons and fields; no sideways scroll at 375 on any page.
