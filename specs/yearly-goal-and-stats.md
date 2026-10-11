# Feature Spec — Yearly goal and stats page

**Status:** ✅ Built and reviewed 2026-10-11 (Apollon c74a0ab, ae75804, 9668a86, 054deae, plus the page-count overflow fix). Roadmap Stage 9. Wanted before January 2027, when readers set their goals.

## 1. Problem

Books home already shows a small "books read this year" number (`StatsService`, `GET /api/stats/summary`), and the sidebar has a **Stats** entry that is only a placeholder page. Readers can't set a goal, can't see how they are doing against it, and can't look back over what they read. A yearly goal and a stats page are the biggest reason readers pick and stay with a reading app (`PRODUCT-ANALYSIS.md`), and other apps paywall them. Here both are free, and the page says so.

## 2. Decisions

Asked 2026-10-11:

- **A goal is books or pages.** The reader picks the unit when setting it ("read 30 books" or "read 9,000 pages"). One goal per reader per year; changing the unit or target later is allowed.
- **What counts:** a log with status **Read** and a **finish date in that year** (UTC, like the journal). **Rereads count again.** Did-not-finish never counts toward a goal.
- **Pages:** the log's own `TotalPages`. A book with no page count adds 0 pages, and the page says how many finished books had none, so a pages goal isn't silently short.
- **Private by default.** Stats are only ever shown to their owner. A goal can be switched on to show **on the profile**; when it is, the number shown to a viewer counts only the books whose reading that viewer may see (`ReadingVisibleTo`), so a private book never leaks through a public total.
- **Stats list:** books and pages per month, top authors, genres, moods, pace, average rating, did-not-finish rate, longest and shortest book. A **year picker** with an **All time** choice.
- **Free, and says so.** One line on the stats page: "Stats and goals are free, always."

Chosen without asking (small, easy to change):

- A goal can be set for **last year, this year or next year**: enough to set next year's in December, and to fill in a goal you forgot.
- Years run on **UTC**, like the journal and the existing summary.
- **No streaks, badges or "behind schedule" nagging.** Progress shows "N of M", a bar, and a quiet "ahead / on track / behind by N" line the reader can ignore. Nothing is sent by email or notification.
- Charts are **plain CSS/SVG bars** built from the design tokens, with the numbers as text, so they work in all five themes and with a screen reader. No charting library.

## 3. Design

### 3.1 Data model

New table **`ReadingGoals`**: `Id`, `UserId` (FK, cascade), `Year` (int), `Unit` (`Books` / `Pages`), `Target` (int, 1–10,000 books or 1–1,000,000 pages), `ShowOnProfile` (bool, default false), `CreatedAt`, `UpdatedAt`. Unique index on `(UserId, Year)`. Gets the account-deletion filter like the other user-owned tables (`ConfigureDeactivationFilters`).

No change to `Logs`.

### 3.2 Counting rules (one place)

`ReadingProgressCalculator` (static, in `Argos.Api/Services`, unit-tested): given a goal and the year's finished-log rows, returns `{ done, target, percent, pagesUnknown, expectedByNow, paceStatus }`.
- `done` = number of finished logs (Books) or the sum of `TotalPages` (Pages).
- `expectedByNow` = `target × dayOfYear / daysInYear` for the current year; the full target for a past year; 0 for a future year.
- `paceStatus`: `ahead` when `done` is more than 1 unit ahead of expected, `behind` when more than 1 unit behind, else `onTrack`; `complete` once `done >= target`. Past years are only `complete` or `missed`.

### 3.3 Endpoints

```
GET    /api/goals/{year}          → the caller's goal for that year with progress, or 404
PUT    /api/goals/{year}          { unit, target, showOnProfile }  → the goal with progress (create or replace)
DELETE /api/goals/{year}          → 204
GET    /api/stats/overview?year=  → the stats below; no year = all time. Caller's own data, private books included.
GET    /api/users/{username}/goal → the profile goal for the current year, or 404 when none is public.
                                    Progress counts only books the viewer may see.
```

- `year` must be within the current year ±1 for goals, and 1900–next year for stats (same range check as the journal, `JournalService.ValidateYear`).
- `GET /api/stats/summary` (Books home) stays, and also returns the current year's goal progress when there is one, so the home card needs one request.
- The profile goal answers 404 for blocked or deactivated readers, like the rest of the profile (`IsHiddenFromAsync`).

### 3.4 `GET /api/stats/overview`

One query reads the caller's logs in the period with the columns needed (`Status`, `FinishedAt`, `Rating`, `TotalPages`, `Moods`, `Pace`, and the book's `Title`, `Authors`, `Genres`, `OpenLibraryId`), then everything is computed in memory (a reader's logs number in the hundreds or low thousands; no extra tables). Returns:

| Field | Meaning |
|---|---|
| `booksRead`, `pagesRead`, `booksWithoutPages` | Finished (Read) logs in the period; pages summed from known counts |
| `byMonth` | 12 entries `{ month, books, pages }` for a year; for All time, one entry per year `{ year, books, pages }` |
| `averageRating`, `ratingCounts` | Mean of rated finished logs; counts per half-star value |
| `didNotFinish`, `dnfRate` | DNF logs with a finish/stop date in the period, and DNF ÷ (Read + DNF) |
| `topAuthors` | Up to 10: `{ name, books }`, counted per finished log |
| `topGenres`, `topMoods` | Up to 10 each: `{ key, count }` (keys are translated on the site) |
| `paceCounts` | Counts of Slow / Medium / Fast |
| `longest`, `shortest` | `{ title, openLibraryId, pages }` among finished logs with a known page count |
| `reread` | How many of the finished logs were rereads |

Empty states are real: a year with nothing read returns zeros and empty lists, and the page says so kindly instead of showing empty charts.

### 3.5 Frontend

- **`StatsPage`** (replaces the placeholder): year picker (this year, the years you have data for, All time), the goal card, summary tiles, books-per-month and pages-per-month bars, top authors (each links to the author's search), genres, moods and pace as ranked bars, ratings histogram, longest and shortest book (link to the book page), the "free, always" line.
- **Goal card** (on the stats page and on Books home): "Set a goal" when none; otherwise progress bar, "12 of 30 books", the pace line, **Edit** and **Remove**. Setting/editing is a small inline form: unit, target, and "Show on my profile".
- **Profile:** when a goal is public, a one-line progress bar under the profile header: "Reading goal 2026: 12 of 30 books".
- **Books home:** the existing summary tile gains the goal progress (or a "Set a yearly goal" link).
- Every on-screen string through `t()` in all five locales; styling only from the design tokens; checked at phone width (≤ 640 px) and in all five themes.

## 4. Explicitly out of scope

- Wrapped / shareable year-in-review image (Stage 11).
- Streaks, badges, reminders or notifications about a goal (Stage 5 may add an optional reminder later).
- Comparing stats with other readers, or public stats pages.
- Reading-speed stats (needs per-session timing the log doesn't have).
- Editing a goal for years outside last/this/next.

## 5. Tasks

### Phase 1 — Backend
- [x] Migration: `ReadingGoals` (+ deactivation filter)
- [x] `ReadingProgressCalculator` with unit tests (books, pages, unknown pages, past/future year, leap year, pace status boundaries)
- [x] Goal endpoints (`GET/PUT/DELETE /api/goals/{year}`), validation, error codes + translations
- [x] `GET /api/stats/overview` (+ repository projection) and the goal in `GET /api/stats/summary`
- [x] `GET /api/users/{username}/goal` with `ReadingVisibleTo`, block and deactivation handling
- [x] Integration tests: counting (rereads yes, DNF no, year edges), private books excluded from the public goal, another reader's goal/stats unreachable, 404/400 cases

### Phase 2 — Frontend
- [x] API client + types + query keys
- [x] Goal card (set / edit / remove) on the stats page and Books home
- [x] `StatsPage` with year picker and all sections; empty states
- [x] Profile goal line
- [x] Translations (five languages) and tests (Vitest)

### Phase 3 — Verification
- [x] Browser check: phone width and all five themes, empty account and a seeded one (`browser-check`)
- [x] Reviewer; argos-security (a new privacy-relevant endpoint on the profile)
- [x] Manual test plan `testing/stats-and-goals.md` (`test-plan` skill)
- [x] CHANGELOG line, ROADMAP Stage 9 ticked

## 6. Build notes (2026-10-11)

- Goals are in the data download (`goals.csv`) and go with the account (FK cascade, deactivation filter).
- Only finished logs **with a finish date** count (a Read log with no date is not in any year, nor All time).
- The home card takes its goal from `GET /api/stats/summary` (one request); the stats page uses `GET /api/goals/{year}`.
- The year picker always offers this year and next year, so a goal can be set before anything is read.
- Browser check (side ports): goal set through the UI, no sideways scroll at 375 px in all five themes, a viewer sees 2 of 24 when one of 3 finished books is private.
- Review findings fixed: a double first save answered 500 (now becomes an update); DELETE works for any year so an aged-out goal can be removed; `/stats?year=` out of range falls back to this year; page sums are added in `long` and clamped. Not done: the frontend repeats the 10,000 / 1,000,000 target caps (only matters if they change).
- Open for later: `Log.TotalPages` has no upper limit (the stats clamp it, the log form doesn't).
