# How well do you remember when you finished it?

Status: built 2026-11-01, not pushed. Option 2 of the discussion on 2026-11-01, agreed with the user.

## Goal

Logging a book as Read no longer silently fills in today's date. A reader who finished a book last spring, or doesn't remember when, says so, and the book still counts where it should. Background: `bugs/read-without-finish-date-not-counted.md` added the silent "today" prefill so Read books count in the year; it makes "I finished it today" look true for every book added from memory.

## Behaviour

The Finished field of the log form (and of "Mark as read" on the profile add panel) becomes a small choice instead of a bare date input:

| Choice | Stores | Counts in |
|---|---|---|
| **Today** (the preselected one) | the date, precision Day | year, month, day, streaks, everything |
| **Pick a date** | the date, precision Day | everything |
| **A year** (any year, this year first) | `FinishedAt` = 1 Jan of that year, precision Year | that year's count, goal and lifetime totals; **not** month charts, streaks, "finished in N days" |
| **I don't remember** | `FinishedAt` null, precision Day | lifetime totals only (already the case for undated imports) |

- The choice is always visible, so "Today" is a decision the reader can see, not a hidden default.
- Journal: Day shows "Finished Oct 12" as now; Year shows "Finished in 2024"; undated shows no date line (as now).
- Ordering (journal, feeds): a Year-precision log sorts at the start of its year, as its stored date does.
- A year in the future is refused, like a future date today (check what the existing validation says and reuse it).
- Existing logs: all are Day precision (migration default). Nothing changes for them, including undated imports.
- Open decision: whether "Today" should stay preselected. Proposed yes, visible. Revisit if readers still report it.

## Data

- New column `Log.FinishedPrecision` (enum `Day` = 0, `Year` = 1), default `Day`. No new date column: a Year log keeps `FinishedAt` at 1 Jan so every existing year filter, ordering and the goal keep working unchanged.
- Every place that uses the month, day or the span between dates must skip Year-precision logs. Known spots from `grep FinishedAt` (85 hits, 38 files):
  - `StatsOverviewCalculator.cs`: month buckets (~l.136, 259), the days-to-finish calculation (~l.306), and the per-day lists.
  - `LogRepository.cs`: `GetFinishedDatesAsync` (~l.252, used for streaks and the day calendar) and the stats row query (~l.261-276).
  - `ReadingGoalDtos` / goal progress: counts by year only, needs no change; add a test.
  - `ActivityRecorder`, `ReviewDtoMapper`, `JournalService`/`JournalDtos`, `DiscoveryRepository`, `AuthorReadersRepository`, `AccountExportRepository`/`AccountExportWriter` (export the precision), imports (`ImportRowWriter`, `ImportRowMerger`: a Goodreads row with a date stays Day).
  - Clubs and buddy reads (`ClubService`, `BuddyReadRules`) use `FinishedAt` for their own meaning (a member finished the book); read each use before touching it.

## Backend

- [x] `FinishedPrecision` enum and `Log.FinishedPrecision`, EF config, migration (default Day). Careful: backfill nothing.
- [x] `CreateLogRequest` / `UpdateLogRequest` / `LogDto` carry `finishedPrecision`; validation: Year precision requires a `FinishedAt` of 1 Jan, not in the future; Day precision as today.
- [x] Mark Year-precision rows in the stats row type and skip them in month buckets, streaks, day lists and days-to-finish.
- [ ] Export (`AccountExportWriter`) writes a year-only finish as 1 January, so it re-imports as an exact day. Left for later: the Goodreads-style "Date Read" column has no way to say "year only".
- [x] Review the other `FinishedAt` readers listed above and note in this spec which needed a change. Changed: stats overview calculator (month buckets, days-to-finish, sheet flag), `StatsService` year card, `LogRepository` (dates and rows carry the flag), journal, review and log DTOs. Unchanged on purpose: goal progress (counts by year), clubs and buddy reads (their own `FinishedAt`), `ActivityRecorder` (1 January sits deep in the timeline), imports (stay exact days).

## Frontend

- [x] `LogForm.tsx`: replace the Finished date input with the four-way choice; remove the silent `dateToInputValue(new Date())` prefill and the "Add a finish date so this book counts" hint (replace with a one-line hint under "I don't remember": "It will count in your lifetime total, not in a year.").
- [x] `quickLog.ts`: "Finished!" keeps today, Day precision. Profile add panel (`ProfileAddBook.tsx`): "Mark as read" keeps today, with the "Add rating or details" step able to change it.
- [x] `JournalList.tsx`, `journalShelfBook.tsx`, `BookReadersSection.tsx`, `ProfilePage.tsx`, `StatsBooksSheet.tsx`: show "Finished in 2024" for Year precision.
- [x] Types (`api/types.ts`, `api/logs.ts`).
- [x] Strings in all five locales (choice labels, hint, journal line); run `locales.test.ts`.
- [x] Read `PRODUCT.md` and `DESIGN.md`, then use the `web-design` skill for the control (a segmented control, not a dropdown); screenshot critique round.

## Verification

- [x] `LogForm.test.tsx`: each choice sends the right payload; no choice is made silently; editing a Year log shows it selected.
- [x] Backend tests: Year log counts in year total and goal, is absent from month buckets, streak days and days-to-finish; future year refused; existing logs default to Day.
- [x] Browser check (`browser-check` skill): log one book per choice as a new reader; year card, stats page, journal and goal show what the table above says.
- [x] `reviewer` agent at the end; `argos-security` not needed (no new auth, privacy or external call).
- [x] Update `bugs/read-without-finish-date-not-counted.md` (note that the prefill was replaced) and add a CHANGELOG line when built.

## Built notes

- "Today" stays preselected and visible. "Mark as read" on the profile add panel still logs with no date (it already did, for adding old books), which is the same as "Not sure".
- Backend error codes: `logs.finishedYearInvalid`, `logs.finishedPrecisionInvalid` (translated in all five).
- The month lists in the journal group a year-only finish under January of its year; the line itself reads "Finished in 2023".
- Browser check done with a new reader (all four choices, edit, quick finish, phone width). `reviewer` agent run; its four fixes are in (profile "read this year" uses the UTC year; a year-only log edited to another status keeps its year; an update that omits `finishedPrecision` keeps the stored one; the year check has the same one-day slack as the day check). `argos-security` not needed.
- A year-only finish in the current year sorts at 1 January, so it does not show in "recently read", Discovery windows or the Feed. Intended (same rule as old books), but it means "A year = this year" is quiet for followers.
- `SPEC.md` §7 still needs the `FinishedPrecision` column added.
