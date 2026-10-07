# Feature Spec — Reading Progress Tracking (Pages, Percentage, Progress Notes)

**Status:** ✅ Implemented (2026-09-28)

## 1. Problem

Follow-up to `specs/home-dashboard-redesign.md`'s progress strip (section 1) and a design question left open after it shipped: what should clicking an avatar in that strip actually do? Navigating away to the friend's full profile page (the original decision) felt like too much for what's supposed to be a quick glance.

The user's answer reframes the strip's whole purpose: show *real reading progress* — a percentage complete — and let the reader who's "currently reading" a book jot a short note about how it's going, not just a bare status label. This spec covers both: the data needed to compute and store that progress, and a new entry point (a "+" tile, Instagram's own "your story" convention) for adding it.

## 2. Clarifying decisions made (via questions to the user)

- **A progress note is a separate field from review text.** Writing "loving this so far" while reading must *not* reclassify that `Log` into the reviews feed — today, any non-empty `ReviewText` is exactly what makes a log show as a review instead of progress (`specs/home-dashboard-redesign.md` §2/§3.3, `specs/book-posts.md` §3.2's merged-feed query). A new `ProgressNote` field keeps that rule intact: the real review, written deliberately at "read," stays the only thing that surfaces in the main feed.
- **A single current snapshot, not a history of updates.** Percentage/page/note live directly on the `Log` and get overwritten each time they're updated — the same editing model `Log` already uses for status/rating/dates (`LogForm`, task 05). Not a Goodreads-style timestamped list of past updates; that's a bigger feature nobody asked for yet.
- **Percentage is derived from pages, not entered directly.** The user's own words: "for a new book the possibility to add how many pages are there, so when the person wants to update it you can add which page you are in and it calculates the percentage." So `Log` tracks `TotalPages` and `CurrentPage`; percentage is *computed* (`CurrentPage / TotalPages`), never stored redundantly — storing both would let them silently drift out of sync.
- **Entry point: a "+" tile at the start of the progress strip**, mirroring Instagram's "your story" slot. It opens two paths: start tracking a new book (pick a book, optionally set its page count) or update progress on a book already being tracked (pick from your own currently-reading books, enter the page you're on).
- **Avatar click becomes a popover, not a profile navigation** — this is what actually motivated the feature: the popover now has real content (a progress bar, a note) worth showing without leaving the feed, closing the open question from the previous session.

## 3. Design

### 3.1 `Log` gains three nullable fields

```
Logs(..., total_pages, current_page, progress_note)
```

- `TotalPages` (`int?`) — the edition's page count, entered by the user (not sourced from Open Library — SPEC.md's `Books` table has no page count today, and Open Library's page-count data is inconsistent enough that per-user entry is simpler and more reliable than a new external-data dependency).
- `CurrentPage` (`int?`) — updated as the user reads.
- `ProgressNote` (`string?`, same 1000-char cap as `Post.Content` for consistency) — "why I'm reading this" or "how it's going," distinct from `ReviewText`.
- All three meaningful only when `Status == CurrentlyReading`; nullable regardless, simply unused/unset for other statuses (a `Read` log doesn't need a page tracker, a `WantToRead` log has no progress yet).
- Migration `AddReadingProgressToLogs`.
- Validation (`LogService`, both `CreateAsync` and `UpdateAsync`): `CurrentPage` must be between 0 and `TotalPages` when both are present (no negative pages, no page 400 of a 300-page book); `TotalPages` must be positive when present; `ProgressNote` ≤1000 chars.
- **Percentage is never stored.** `LogDto`/`ActivityItemDto` expose `TotalPages`/`CurrentPage` as-is; the frontend computes `Math.round(currentPage / totalPages * 100)` wherever it's displayed (same "derive, don't duplicate" reasoning as the field split itself).

### 3.2 API — extends the existing Log endpoints, no new ones

No new controller. `CreateLogRequest`/`UpdateLogRequest`/`LogDto` each gain `TotalPages`, `CurrentPage`, `ProgressNote`. `POST /api/logs` and `PUT /api/logs/{id}` (already used by `LogForm` for create/edit) carry the new fields exactly like `Rating`/`ReviewText` do today — no dedicated "progress update" endpoint, because this is still just editing a `Log`, the same operation `LogForm` already performs.

`ActivityItemDto` (`GET /api/feed/activity`, the progress strip's data) gains `TotalPages`, `CurrentPage`, `ProgressNote` so the strip/popover can render them without a second request.

### 3.3 `LogForm` gains the new fields — reused, not duplicated

When `status === 'CurrentlyReading'`, `LogForm` shows two additional fields: "Total pages" (number input) and "Current page" (number input, only meaningful once total pages is set), plus reuses its existing review-text-shaped textarea pattern for a new "Progress note" field (placeholder: "Why are you reading this, or how's it going?"). These are hidden for any other status — consistent with §3.1's "meaningful only when currently reading."

This is the *same* `LogForm` `BookDetailPage` already uses for the full log/rate/review flow — no parallel form component. Both new entry points below (§3.4) end up rendering this one form, in create or edit mode exactly like today.

### 3.4 The "+" tile and its two paths

New `AddProgressTile` component, rendered as the **first** item in `ActivityStrip` (before any friend's avatar), styled like the strip's avatars but with a "+" glyph instead of a photo — same visual slot Instagram gives "your story."

Clicking it opens `ProgressUpdateModal` — a small chooser (reusing the same backdrop/dialog shell `PostComposerModal` established) with two options:

- **"Start a new book"** — opens a `BookPicker` (the debounced-search UI factored out of `PostComposerModal` into its own shared component, since this is exactly the second consumer that made the duplication worth removing) to pick a book, then renders `LogForm` in create mode with `defaultStatus="CurrentlyReading"` (a new `LogForm` prop) and its total-pages/current-page/progress-note fields visible per §3.3.
- **"Update progress on a book I'm reading"** — fetches the current user's own `CurrentlyReading` logs (`getLogsByUser(userId, 'CurrentlyReading')`, already existed — no new endpoint) as a pickable list (cover + title), then renders `LogForm` in edit mode for the chosen log, prefilled, so the user can bump `CurrentPage` and/or edit the progress note.

### 3.5 Avatar click → popover (replaces the profile-navigation decision)

> **Superseded 2026-10-04** by `specs/reading-stories.md`: the popover is gone, replaced by a stories-style viewer with likes and comments. Kept below for history.

`ActivityStrip`'s per-friend avatars now open a small popover instead of navigating away (closes the question left open at the end of the previous session):

- Avatar + name (links to `/u/{username}` — going to the profile is still one click away, just not the *default* action).
- Book cover + title (links to `/books/{openLibraryId}`).
- Status label.
- If `TotalPages`/`CurrentPage` are both present: a simple progress bar + "`{percent}%` (`{currentPage}`/`{totalPages}` pages)". If only one or neither is present: nothing extra — no broken half-bar.
- `ProgressNote`, if present.

No edit affordance inside the popover itself — updating your *own* progress happens through the "+" tile (§3.4); the popover is read-only, for viewing a friend's progress.

**As built:** "anchored to the strip" turned into a fixed-position card near the top of the content area (a transparent full-viewport backdrop handles click-outside-to-close) rather than a true DOM-anchored dropdown positioned beneath the specific avatar clicked. Positioning a popover precisely under a scrollable flex item, without clipping against `ActivityStrip`'s own `overflow-x: auto` (which makes `overflow-y` compute to `auto` too, per the CSS Overflow spec's "only one axis set" rule — risking the popover getting cut off), would have needed real coordinate math or a positioning library. The fixed-position card is simpler, fully reliable, and still satisfies "without leaving the feed" — just not literally anchored beneath the clicked element.

## 4. Explicitly out of scope

- Page counts sourced from Open Library — user-entered only, per §3.1's reasoning. Could be revisited later as a pre-fill convenience, not required now.
- A history/timeline of progress updates (Goodreads-style) — single current snapshot only, per §2.
- Editing a friend's progress, or any interaction (likes/comments) on the popover — view-only.
- Progress tracking for `WantToRead` or `Read` statuses — pages/percentage only make sense mid-read.
- Reading pace/estimates ("3 days left at this rate") — no velocity tracking, just the raw current/total numbers.
- A dedicated "progress update" API endpoint — deliberately reuses the existing Log create/update endpoints (§3.2).

## 5. Tasks

### Backend

- [x] `Log` domain entity: add `TotalPages`, `CurrentPage`, `ProgressNote`.
- [x] Migration `AddReadingProgressToLogs`.
- [x] `LogService.CreateAsync`/`UpdateAsync`: validate `CurrentPage` within `[0, TotalPages]`, `TotalPages` positive, `ProgressNote` ≤1000 chars.
- [x] `CreateLogRequest`, `UpdateLogRequest`, `LogDto`: add the three fields.
- [x] `LogsController`: no route changes — existing `Create`/`Update`/`ToDto` just carry the new fields through.
- [x] `ActivityItemDto` + `FeedController.GetActivity`: add `TotalPages`, `CurrentPage`, `ProgressNote`, sourced from the same `Log` rows `GetLatestStatusUpdatesByUserIdsAsync` already returns.
- [x] Backend tests: validation (page bounds, note length — `LogServiceTests`), the new fields round-tripping through create/update, `GetActivity` surfacing them (`FeedControllerTests`). Full suite: 68/68 passing.

### Frontend

- [x] `LogDto`, `CreateLogRequest`, `UpdateLogRequest`, `ActivityItemDto` types gain `totalPages`, `currentPage`, `progressNote`.
- [x] `LogForm`: total-pages/current-page number inputs + progress-note textarea, shown only when `status === 'CurrentlyReading'`, per §3.3. Also gained a `defaultStatus` prop for create-mode default (used by the "+" tile's "start a new book" path).
- [x] `BookPicker` — factored out of `PostComposerModal` into its own component, reused by `ProgressUpdateModal`'s "start a new book" path.
- [x] `AddProgressTile` — the "+" slot, first in `ActivityStrip`.
- [x] `ProgressUpdateModal` — the chooser (start new / update existing) wired to `LogForm` in the two modes per §3.4.
- [x] `ActivityStrip`: avatar click opens `ActivityItemPopover` (per §3.5) instead of navigating to `/u/{username}`; the strip now always renders (see the superseded note in `specs/home-dashboard-redesign.md` §3.2).
- [x] `ActivityItemPopover` — book/status/progress-bar/note display, per §3.5 (as-built positioning noted there).
- [x] Tests: `LogForm.test.tsx` (progress fields conditional on status, payload correctness), `ActivityItemPopover.test.tsx` (percentage math, missing-pages/note states), `ActivityStrip.test.tsx` ("+" tile always present, avatar click opens popover not navigation). Full suite: 36/36 passing.

### Verification & docs

- [x] Live verification: started tracking a new book (412 pages) via the "+" tile as one user, confirmed a follower's popover showed 23% (95/412 pages) and the progress note; used "update progress" on the same book, confirmed the follower's popover updated to 63% (260/412) with the new note — same `Log` row, not a duplicate. Verified on both desktop and mobile viewports. No console errors.
- [x] `CHANGELOG.md` entry.
- [x] `SPEC.md`: §3 domain model / §7 data model note the three new `Log` fields; `specs/home-dashboard-redesign.md` §3.2 and its empty-state note updated to reflect the popover and always-visible "+" tile replacing the original profile-navigation/empty-strip decisions (spec drift corrections, not rewrites).
