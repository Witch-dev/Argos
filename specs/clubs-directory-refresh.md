# Feature Spec — Clubs Directory Refresh

## 1. Problem

The Book Clubs page (`/clubs`, `ClubsDirectoryPage`) is one flat list of text rows: name, optional description, a phase pill and a member count. The viewer's own clubs are mixed in with strangers' clubs and only stand out in the right panel. Nothing is visual, so the page looks bare next to Lists, where covers carry the design. Raised 2026-10-04 while reviewing the page as `alice_reads`.

## 2. Decisions

- **Your clubs first.** A "Your clubs" section above the directory shows the viewer's active clubs as larger cards: the current book's cover, the book title (or "Choosing next book"), their own progress bar, the next checkpoint and the member count. The data comes from the existing `GET /api/clubs/mine`.
- **The directory becomes "Discover clubs"** and leaves out clubs the viewer is already in, so no club shows twice. It's filtered on the frontend by the ids from `/clubs/mine`, since the list is small and not paginated.
- **Covers on every card.** If a club is Reading, its card shows the book's cover. If it's Suggesting, the card shows a plain placeholder slot of the same size, so the rows line up.
- **The old test clubs stay.** Realistic seed clubs are added next to them in the dev database (data only, not code).
- Out of scope for now (follow-ups): member avatar stacks, "active N days ago", a first-visit explainer.

## 3. Design

### Backend
- `ClubDto` gains `CurrentBookCoverUrl` (null unless Reading).
- `MyClubSummaryDto` gains `CurrentBookCoverUrl` (null unless Reading) and `MemberCount` (active members).
- Both are filled in `ClubService.SearchDirectoryAsync`/`GetMyClubsAsync` from the current round's `Book`, which is already loaded for the title. `MemberCount` reuses `CountActiveByClubIdAsync`.

### Frontend
- `ClubsDirectoryPage`: a "Your clubs" grid (two columns on desktop, one at ≤640px) when the viewer has clubs, then a "Discover clubs" heading, the search box and the rows.
- A small `ClubCover` helper inside the page: the existing `BookCover` while Reading, or a dashed empty 2:3 slot while Suggesting. *As built:* reuses `BookCover` rather than a new component file.
- *Added while building:* Discover is sorted by member count, biggest first, so active clubs lead and 1-member clubs sink. On ≤640px the phase pill and member count move under the name instead of squeezing the description.
- *Follow-up (same day):* with no cover image (still choosing, or Open Library has none) the slot shows a template book instead of a dashed box: the club's initial, an accent-tinted background (one of three tints, chosen by hashing the club name so it's stable) and a spine strip, using only `color-mix` of existing tokens.
- Progress: a thin bar with `role="progressbar"` and "N%" ("Not started" when null).
- Only existing tokens are used, and the layout is checked in dark mode at 390px.

## 4. Tasks

#### Backend
- [x] DTO fields and service mapping. Tests: `Directory_ShowsTheCoverOnlyWhileReading` (new), plus cover and member-count assertions on `/clubs/mine` in the buddy-read test. The seeded test books now have a `CoverUrl`.

#### Frontend
- [x] Types, `ClubCover`, the "Your clubs" section, the "Discover clubs" filter and sort, covers on directory rows. `ClubsDirectoryPage.test.tsx` +1 test (Your clubs card with progressbar/members/checkpoint; your club not repeated in Discover) and a cover assertion; fixtures updated.
- [x] Seeded in the dev database through the API: 5 public clubs (3 Reading, 2 choosing with suggestions), 3–7 members each, progress logs, and `alice_reads` in "Slow Sci-Fi Society". New helper readers: `noor_reads`, `sam_turns_pages`, `lee_annotates`, `ines_margins`, `oskar_chapters` (password `Password123!`).
- [x] Viewed live in Chromium as `alice_reads`: light and dark at 1280px, and light at 390px. The first pass found the rows cramped at 390px, which was fixed by stacking the meta.
- [x] Reviewer + security-review pass. Security: nothing leaks (the directory is filtered to public clubs before mapping; cover URLs are built server-side from Open Library's numeric ids). Fixed from review: `ClubPage` actions and `CreateClubModal` now refresh `clubs.mine` and every directory search (new `queryKeys.clubs.directoryAll()`), so the Clubs page isn't up to 60s stale; Discover waits for `/clubs/mine`, so your clubs don't flash in it; the empty state says "No other clubs match." while searching; a misplaced XML doc comment was moved. +2 tests (Discover sort order, a choosing club without a progress bar plus the search empty state). Left as-is: one count query per club in `/clubs/mine` (bounded by your own club count), and the pre-existing unpaged public `GET /api/clubs`.
