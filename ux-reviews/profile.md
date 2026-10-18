# UX review — Profile and shelves (`/u/:username`)

Reviewed: 2026-10-18 · Themes: Paper, Dark · Widths: 375, 1280 · Readers: your own profile with data (20 books on four shelves, five favourites, no display name, no goal) and someone else's (alice_reads, followed, with a goal, lists and a favourite author) · Apollon at `75a397b` (dev server)
Screenshots looked at: both profiles at the top, 750 and 1,500px down, at 1280 and 375 in Paper and Dark. Keyboard pass on alice_reads at 375 in Dark (`tabwalk.mjs`). Layout shifts from `shoot.mjs --shifts` (dev server; the shifts come from data arriving, so they hold on a production build too). Not captured: a private profile, a blocked reader, an empty new profile, the followers panel and the add-a-book search open (checked when the page was built, `specs/shelf-design-refresh.md` Phase 3).

First review of this page; it was restyled in Phase 3 of the shelf refresh (2026-10-17).

## Summary

The page looks like Winged Words now: the round photo in its ring, the display-size name, one row of facts, favourites and every shelf on boards. Two things get in the way of using it: the page jumps while its parts load (the shelves move down 180–465px as the favourites, favourite authors and goal arrive; CLS 0.12–0.16), and the shelf you picked isn't remembered, so opening a book from "Read" and going Back lands on "All" at the top.

## Scores

**Nielsen: 25/36 (69%, acceptable**, one point under good). Help (10) n/a.
- **3 User control: 2.** Back from a book loses the chosen shelf and the "Show more" count (finding 2).
- **7 Flexibility: 2.** A shelf can't be linked or returned to (`?shelf=` doesn't exist); no sort on a shelf of 20+ books.
- Scored 3: status (1), real-world match (2), consistency (4: "Journal" is a tab among shelf filters and also a sidebar item), error prevention (5), recognition (6), aesthetic (8), error recovery (9).

**Cognitive load: moderate** (2 of 8 failed: *single focus*, on your own profile "Add a book" and the rail's "Set a goal" are both green, see `author-page.md` #11; *minimal choices*, seven shelf tabs in one row, two of them empty on alice's profile).

**Personas:** Alex (power user, 800 books): picks "Read", opens a book, comes back to "All" and the first 24 books, every time (2). Tomás (social reader): alice's goal, favourite author and Following state are clear; "Did not finish 0" and "Favourites 0" are tabs he can open to nothing (3). Sam (keyboard): every tab and button is 44px with visible focus; the shelf tabs are `aria-pressed` buttons in a row, fine; the jump in layout moves the focused tab when the favourites arrive late (1).

**Specificity:** passes: shelves on boards, the name in Literata, the photo ring, named facts.

**Motion:** none new; a book added from your own profile settles onto its shelf (built in the motion task). The layout shifts in finding 1 are the opposite of calm.

## Findings

### 1. The page jumps as favourites, favourite authors and the goal arrive — P2 · M · Rule
**Where:** `ProfilePage.tsx:248` (`ProfileGoalLine`), `:328–329` (`FavouriteBooksRow`, `FavouriteAuthorsRow`): each fetches on its own and renders nothing until it answers.
**What:** measured with `shoot.mjs --shifts`: on your own profile at 1280 the Shelves section moves from y 322 to 787 (CLS 0.12–0.14); on alice's at 1280 from 310 to 536 in two steps, and at 375 from 438 to 604 (0.155–0.158 in all, against 0.068 for pages without this, the shell's own share).
**Why it matters:** DESIGN.md's "Reserve space for late-arriving things" (CLS < 0.1); a reader who taps a shelf tab in the first second hits whatever slid under their thumb.
**Fix:** the profile response already says what's there (`favouriteCount`, a goal, favourite authors, or add those counts): while each part loads, render its heading and a placeholder of the right height (`LoadingMessage variant="covers"` for the favourites shelf, a one-line skeleton for the goal), and nothing only when the profile says there's nothing. Re-measure at 375 and 1280, target < 0.1 beyond the shell's 0.066.
**Status:** fixed 2026-10-18: the profile waits for its goal, favourite books and favourite authors (same requests, in parallel) before showing the page. Measured after: own profile at 1280 CLS 0.004 (was 0.12–0.14), alice at 375 0.068 (was 0.158, the rest being the shell header); what remains at 1280 is the rail (`bugs/rail-clubs-card-shifts-layout.md`).

### 2. The chosen shelf isn't kept in the address — P2 · S · Rule
**Where:** `ProfilePage.tsx:83–87` (`chosenTab` in component state), and the "Show more" count beside it.
**What:** pick "Read", show more, open a book, press Back: the profile returns on "All" with the first 24 books. A shelf can't be shared or bookmarked either.
**Why it matters:** browsing a shelf is the main thing a visitor does here (Tomás on a friend's "Read"; Alex on their own 800 books); losing the place on every Back makes it tiring.
**Fix:** keep the tab in `?shelf=` (`read`, `want`, `reading`, `dnf`, `favourites`, `journal`; All without a parameter), set with `replace: true` as the author page does for `?sort=`; keep the shown count with it (`?shown=`) or in `sessionStorage` by profile and shelf.
**Status:** fixed 2026-10-18: the shelf is `?shelf=Read` (replace, All without a parameter), and "Show more" is remembered for the browser tab in sessionStorage by profile and shelf.

### 3. Empty shelves are tabs on someone else's profile — P3 · S · Judgement
**Where:** `ProfilePage.tsx` `TABS` row; "alice_reads at 1280": "Did not finish 0", "Favourites 0".
**What:** seven pills wrap to two rows at 1280 (one scrolling row on a phone); two of them open to an empty shelf.
**Fix:** on someone else's profile, leave out tabs with a count of 0 (All always stays); on your own, keep them, since there they're where you add a book.
**Status:** fixed 2026-10-18: on someone else's profile, shelves with 0 books are left out (All and the chosen one stay).

### 4. The name and @username repeat when there's no display name — P3 · S · Judgement
**Where:** `ProfilePage.tsx` header (`name` falls back to the username, then `@{profile.username}` under it); "your own profile at 1280 and 375".
**What:** "p4_rev_1792354804" at display size, then "@p4_rev_1792354804" right under it. At 375 the long name also breaks mid-word over two lines.
**Fix:** when the display name is empty, show the username once at display size with the "@" (or leave out the second line); on your own profile, a quiet "Add a display name" link to Settings in its place.
**Status:** fixed 2026-10-18: without a display name the @username line is left out; on your own profile a quiet "Add a display name" link to Settings takes its place (`profile.addDisplayName`, five languages).

### 5. Two green buttons on your own profile ("Add a book" and the rail's "Set a goal") — P2 · S · Rule
Shared with every page: see `author-page.md` finding 11.
**Status:** fixed 2026-10-18 with `author-page.md` #11.

## Looked fine

Heading order (h1 name, h2 sections, h3 list titles); focus visible at every stop; all tabs, Following, the menu, followers/following buttons 44px; the shelf tabs scroll on a phone with an edge fade and the chosen one in the green wash; ratings only on rated books; the goal line and bar on alice's profile; list cards on their small shelves; Dark contrast on tabs, facts and captions; no sideways scroll at 375.
