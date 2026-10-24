# Feature Spec — Stronger stats

**Status:** Built and verified 2026-10-24 (all three phases). Three phases (backend, frontend, verification), size M–L. Builds on `specs/yearly-goal-and-stats.md` (the stats page as it is). Wanted before January 2027, when readers look back on their year, and before Wrapped (Stage 11), which will reuse these numbers.

## 1. Problem

The stats page (`StatsPage`, `GET /api/stats/overview`) is about as good as Goodreads and free StoryGraph: books and pages per month, top authors, genres, moods, pace, ratings, DNF rate, rereads, longest and shortest book. Readers who come from StoryGraph or Letterboxd expect more, and most of it is in data we already store but never show:

- **Every number is a dead end.** "3 books in March" can't be opened to see which three. On Letterboxd every bar and count opens its films.
- **Questions we can answer but don't:** how long a book usually takes you (`StartedAt` → `FinishedAt`), which decades your books are from (`Book.FirstPublishYear`), print vs. ebook vs. audio (`Log.Format`; today only audio is counted), short vs. long books (`TotalPages`), plot- vs. character-driven (`Log.Drive`: we ask it on every review and show it nowhere), fiction vs. non-fiction and adult / YA / children (`GenreCatalog`, `Book.Audience`, `IsGraphicNovel`), and the languages you read in (`Log.EditionLanguage`).
- **No sense of change.** A year's page doesn't say how it compares with the year before.
- **Books that silently don't count.** A Read log with no finish date is in no year and not in All time either (spec §6 build notes), and nothing tells the reader. The page already does this for books with no page count ("N finished books had no page count").
- **One wrong-day path.** Rating a book in a club marks it Read with `FinishedAt = now`, the exact UTC moment (`LogService.StageClubRatingAsync`, both the new-log and the existing-log branch). Every other path stores the calendar day the reader picked, as midnight UTC (`LogForm` `toIsoOrNull`, imports). So a reader in Mexico who rates a club book at 8 pm on 31 December gets it counted in the next year, in the journal, the goal and the stats.

## 2. Decisions

### 2.1 Asked 2026-10-24

The user approved this list from the stats analysis the same day: tap a chart to see its books, days to finish, publication decade, format split, book length groups, plot vs. character, fiction/non-fiction and audience, languages, comparison with the year before, the missing-date line and the club-rating date fix. The reading calendar and "your ratings vs. everyone's" wait for a later phase (§4).

### 2.2 Decisions I made, for the user to confirm

- **Days to finish is a median, not an average**, shown as "Usually 9 days". One book left half-read for two years would drag an average far off. Counted only on Read logs with both dates, inclusive (started and finished the same day = 1 day). Fastest and slowest book shown beside it. Hidden when fewer than 3 books have both dates.
- **Length groups follow StoryGraph's:** under 300 pages, 300–499, 500 and more. Printed and ebook logs with a known page count only, like the page totals.
- **Fiction or non-fiction per book:** fiction when any of its genres is a fiction genre (`GenreCatalog.Genre.IsFiction`), non-fiction when it has genres and none is fiction, "not sorted" when it has no genres. Graphic novels are a separate count beside it, not a third kind.
- **Languages come only from the edition** the reader picked (`EditionLanguage`). Without an edition we don't know the language, and guessing from the title would be wrong for Spanish readers of translated books. The section shows "N books with no edition chosen" and is hidden when no finished book has a language. Open Library uses old bibliographic codes ("spa", "fre", "ger"), so a small map turns them into names through `Intl.DisplayNames` in the reader's site language. An unknown code shows as itself.
- **Comparison with the year before:** a year's page shows "+8 books and +2,140 pages compared with 2025" under the summary tiles, only when the year before has at least one finished book. Plain numbers, no arrows in red or green: reading less isn't a failure (same spirit as "no behind-schedule nagging").
- **Tapping a chart opens a sheet listing the books behind it**, using the existing `Modal`. It works for every month or year bar, every author, genre, mood, pace, rating, format, length group, decade, drive, fiction/non-fiction, audience and language row, and the new "books with no date" line. Books are listed newest finish first, with cover, title, author, finish date and your rating, each linking to the book page. A separate endpoint returns them (§3.3), so the overview stays small even for All time.
- **Books with no finish date:** a quiet line at the bottom of the summary, "2 finished books have no date, so they aren't counted. Show them", opening the sheet. It appears whatever year is picked, because those books are in no year.
- **The club-rating fix:** the club rating request gains an optional `finishedOn` (`yyyy-MM-dd`, the reader's local date, sent by the site), stored as midnight UTC like the form. When it's missing or more than a day from the UTC date, the server uses the UTC date at midnight. Existing club-rated logs are left as they are: early access hasn't started, so there are only a handful.
- **No new tables, no migration.** Everything is computed in memory from one projection, as today.
- Stats stay **private to their owner**, private books included, as before.

## 3. Design

### 3.1 The row

`FinishedLogRow` (`ILogRepository.cs`) gains the columns the new numbers need: `StartedAt`, `Drive`, `EditionLanguage`, `FirstPublishYear`, `Audience`, `IsGraphicNovel`, and the log `Id` (for the sheet). `GetFinishedRowsAsync` projects them; it still reads only Read and DNF logs with a finish date in the period.

### 3.2 `GET /api/stats/overview?year=` gains

| Field | Meaning |
|---|---|
| `daysToFinish` | `{ median, counted, fastest, slowest }`; `fastest`/`slowest` are `StatsBookDto` plus `days`. Null when fewer than 3 books qualify |
| `formatCounts` | `{ key, count }` for `Print`, `Ebook`, `Audio`, `Unknown` |
| `lengthCounts` | `{ key, count }` for `short` (< 300), `medium` (300–499), `long` (≥ 500) |
| `decadeCounts` | `{ decade, count }` from the oldest to the newest decade with a book, gaps included as 0; plus `booksWithoutYear` |
| `oldest`, `newest` | `StatsBookDto` plus `year`, by `FirstPublishYear` |
| `driveCounts` | `{ key, count }` for `Plot`, `Character`, `Mix` |
| `fictionCounts` | `{ key, count }` for `fiction`, `nonfiction`, `unsorted`; plus `graphicNovels` |
| `audienceCounts` | `{ key, count }` for the four `GenreCatalog.Audiences` keys, unknown left out |
| `languageCounts` | Up to 10 `{ key, count }` by `EditionLanguage`; plus `booksWithoutLanguage` |
| `previousYear` | `{ year, booksRead, pagesRead }` for a year's page when the year before has a finished book, else null. Read through the same projection for that one year |
| `booksWithoutDate` | Read logs with no `FinishedAt`, any year (one count query) |

All of it is in `StatsOverviewCalculator`, with unit tests. Counts on Read logs only, like the existing numbers. DNF stays in its own rate.

### 3.3 `GET /api/stats/books?year=&kind=&key=`

The books behind one number, the caller's own, private books included.
- `kind` is one of `month`, `year`, `author`, `genre`, `mood`, `pace`, `rating`, `format`, `length`, `decade`, `drive`, `fiction`, `audience`, `language`, `undated`. `key` is the bar's key (a month 1–12, a year, an author name, a genre key, a half-star rating, a decade such as `1990`, and so on). `undated` ignores `year` and takes no key.
- One rule decides what matches: the calculator exposes `Matches(row, kind, key)` and the overview counts use the same rule, so a bar's number and its sheet can't disagree. A unit test checks that for each kind.
- Returns at most 200 `{ logId, title, openLibraryId, coverUrl, authors, finishedAt, rating }`, newest finish first, plus `total`. A reader with more than 200 books behind one bar sees "Showing the latest 200 of 1,240".
- An unknown `kind`, a `key` that doesn't parse for its kind, or a key longer than 200 characters gets a 400 with an error code. `year` is checked like the overview (`JournalService.ValidateYear`).

### 3.4 Club rating

The round rating request (`PUT /api/clubs/{clubId}/rounds/{roundId}/rating`, `rateRound` in `web/src/api/clubs.ts`) gains an optional `finishedOn`, passed through `ClubService.RateRoundAsync` to `StageClubRatingAsync` as `DateOnly? finishedOn`, which uses it for `FinishedAt` on both branches (the new log, and `log.FinishedAt ??= …`). The rule is in §2.2.

### 3.5 Frontend

- **Bars become buttons.** `ColumnChart` and `StatChart` rows take an optional `onSelect`. When it's set, each bar or row is a `<button>` whose accessible name says the number and what tapping does ("March: 3 books. Show them"). Focus is visible and the bar's look doesn't change otherwise.
- **`StatsBooksSheet`**: the `Modal` with a heading naming the selection ("Read in March 2026", "Fantasy · 2026", "Rated 4★"), the list from §3.3 and a loading, empty and error state. On phones it fills the screen.
- **New sections** on `StatsPage`, in this order after the current ones:
  - "How long books take": "Usually 9 days", plus the fastest and slowest book.
  - "Kinds of books": fiction / non-fiction / not sorted, audience, graphic novels.
  - "How you read": format and length groups. Plot vs. character sits beside the existing pace.
  - "When they were written": decade bars, the oldest and newest book.
  - "Languages": hidden when empty, with the no-edition count.
- **The comparison line** under the summary tiles, and the **no-date line** with its link.
- A section with no data is hidden, not shown empty, as today.
- Every string through `t()` in all five locales, including the bar labels. Language names come from `Intl.DisplayNames`. Only design tokens. `DESIGN.md` and the `web-design` skill for the new sections, with a short plan before markup and a screenshot critique round.
- The club rating call sends `finishedOn` as the browser's local date (`toDateInputValue(new Date())` in `lib/buddyRead.ts`).

## 4. Later (not this spec)

- **A reading calendar**: pages read per day from `ReadingProgressEntry`, the progress history saved at most once an hour. There's only history since the reading-update redesign shipped, and none for imports or readers who never update their page. It needs a decision on streaks first: the stats spec said no streaks, and a calendar must not turn into one.
- **Your ratings vs. everyone's**: your average for a book compared with its Winged Words or Open Library average.
- **Smaller extras** from the same analysis: your highest-rated books of the period, authors new to you vs. returning, milestones (first and last book of the year, your 100th), reviews written in the period, a custom date range ("last 12 months").

## 5. Tasks

### Phase 1 — Backend
- [x] `FinishedLogRow` gains the columns in §3.1, with the repository projection
- [x] `StatsOverviewCalculator`: the new fields in §3.2 and `Matches(row, kind, key)`, with unit tests (median with odd and even counts, same-day = 1, fewer than 3 hidden, length group edges at 299/300/499/500, decade gaps, fiction rule, audio out of lengths, unknown format)
- [x] `previousYear` and `booksWithoutDate` in `StatsService`
- [x] `GET /api/stats/books`: validation, error codes + `errors.codes` translations, the 200 cap
- [x] Club rating `finishedOn` (both branches, the fallback rule)
- [x] Integration tests: overview and sheet agree for every kind, another reader's books unreachable, `undated` ignores the year, 400 cases, a club rating late on 31 December lands on the reader's date

### Phase 2 — Frontend
- [x] API client, types and query keys for the new fields and `/api/stats/books`
- [x] `ColumnChart` / `BarList` selectable bars (§6 Phase 2: `StatChart` is the admin chart), `StatsBooksSheet`
- [x] The new sections, the comparison line, the no-date line (plan first, `web-design`)
- [x] Open Library language-code map and `Intl.DisplayNames`
- [x] `finishedOn` on the club rating call
- [x] Translations (five languages) and Vitest tests

### Phase 3 — Verification
- [x] Browser check: an empty account and a seeded one with every format, dates, decades and languages; tap through every kind of bar; phone width and all five themes (`browser-check`)
- [x] Reviewer; argos-security (a new endpoint that takes user input, and a client-sent date)
- [x] Update `testing/stats-and-goals.md` (`test-plan` skill)
- [x] CHANGELOG line, ROADMAP box ticked

## 6. Build notes

### Phase 1 (2026-10-24)

- **Graphic novels aren't a stored column.** `Book.IsGraphicNovel` is `[NotMapped]`, set only on live search results. The stats query works it out in SQL from `Book.Subjects` with the same rule as `SearchTextHelper.IsGraphicNovel` (the two are marked "change both together"). The subjects themselves aren't fetched: a book can have hundreds.
- **One rule for counts and lists:** `StatsOverviewCalculator.KeysOf(row, kind)` gives the keys a book counts under; every count and `Matches` go through it, and `NormalizeKey` turns a requested key into the same form (`4.0` → `4`, `fast` → `Fast`, `03` → `3`).
- **`StatsBookDto.pages` is now nullable** (null on `fastest`/`slowest` when the reading has no page count; always set on `longest`/`shortest`). It also carries `days` and `year`. `web/src/api/types.ts` needs `pages: number | null` in Phase 2.
- **`daysToFinish.median`** is a number that can end in .5 (an even count): the page rounds it for "Usually N days".
- **Decade bars:** empty decades are filled in as 0 only between 1900 and 2090. Older or odd years (the Odyssey filed as year 800, a wrong 9999) get a bar only when they have a book, so one record can't add hundreds of empty bars. A year of 0 or none counts as "without year".
- **Names longer than 200 characters** (an author, genre, mood or language) get no bar, so no bar opens onto the 400 for an over-long key.
- **`kind=month` needs a year** (400 `stats.badKey` without one): a month bar exists only on a year's page.
- Not done, by the spec: `graphicNovels`, `booksWithoutYear` and `booksWithoutLanguage` have no list of their own (no `kind`). Easy to add (one key each) if Phase 2 wants them tappable.
- A club rating of a book already marked Read with no finish date leaves it undated (the `??=` sits in the "not yet Read" branch, as §3.4 says).
- The goal card and public goal use the same wider projection; the extra columns and the subjects check cost little for a year of logs, so they share it rather than a second query.
- Review (reviewer + argos-security): no leak or count/list disagreement. Fixed: decades counted in one pass and bounded, over-long names, month without a year, all four graphic-novel subject rules tested against Postgres, a duplicated doc comment. A flaky integration test was the startup genre backfill re-deriving genres of seeded books with no audience; seeded books now always have one.

### Phase 2 (2026-10-24)

- **Graphic novels and books with no language got lists; books without a year didn't.** Two kinds with no key, `graphic` and `nolanguage`, go through the same `KeysOf` rule as the rest (`GraphicNovels` and `BooksWithoutLanguage` are now counted through it), with unit and integration checks that each count equals its list. "No edition chosen" is worth a list because it's the to-do list for fixing it (open a book, pick its edition). A missing publication year comes from Open Library and the reader can't change it, so it stays a plain note, like "books with no page count".
- **`BarList`, not `StatChart`.** §3.5 named `StatChart`, but that is the admin page's daily chart. The stats page's rows are `BarList`, so `BarList` and `ColumnChart` take `onSelect`. Only rows and columns above zero become buttons. A zero column keeps its plain spoken text ("March: 0"), and a button says "March: 3 books. Show them".
- **Author names are no longer links.** A link can't sit inside the row's button, so the sheet carries "Go to their author page" (or "Search for their books" without an id).
- **Columns on a phone are at least 24px wide** (WCAG 2.5.8), up from 20px. Twelve 44px columns don't fit 343px, and every column takes the chart's full height.
- **Fewer cards than §3.5 listed** (critique round): eight same-looking cards in a row was the "same-size cards as structure" refusal. "Kinds of books" is now parts of "What you read". "How long books take" and "Languages" are parts of "How you read", whose order is: how long, format, languages, length, pace, plot or characters, ratings (an edition's language is how you read a book, like its format). "When they were written" keeps its own card. The page is five cards and the shelf.
- **The decade chart keeps 44px columns on a phone** (`ColumnChart wide`) and scrolls sideways inside its card, with every label written in full. A thinned axis of "1900, 1920…" was misread as single years, and "2000s" was clipped. That exposed an older bug: the chart's visually hidden labels are absolutely positioned and escaped the unpositioned scroller, widening the whole page on a phone. `.scroller` is now `position: relative`.
- **The median is rounded** for "Usually N days" (9.5 → 10). Fastest and slowest are tiles with the book's title as the detail. The shelf at the end is now "Books that stand out": longest, shortest, oldest, newest. A book holding two of these stands there once, with both lines.
- **The comparison line** uses `signDisplay: 'exceptZero'` ("+8 books and +2,140 pages compared with 2025", "−3 books…"). It drops the pages when neither year has any (all audiobooks).
- **The sheet's count line** says the year only when the heading doesn't already ("2 books read in 2026" for an author, "2 books" for "Read in March 2026"), and "Showing the latest 200 of 1,240" over the cap.
- **Language names** reuse `lib/editionLanguage.ts` (the bibliographic→terminology map from the formats spec), so no second map was written.
- **Club rating:** `RoundRating` sends `finishedOn: toDateInputValue(new Date())`.

- **Review** (reviewer): no correctness bugs. Taken: the hover look on selectable rows and columns only under `@media (hover: hover)`, so a tapped bar doesn't keep it on a phone. The design-reviewer's fresh pass asked for a lead number and a tidier tile row in the year card: that card is unchanged in this phase, so it's left for a `ux-review` of /stats.

### Phase 3 (2026-10-24)

- **Browser check passed** on the side ports. An empty reader sees only the empty message. A seeded reader with every format, length edge, decade, two languages, no-edition and undated books gets every section: 61 sheets on 2026 and 54 on All time, each with a count equal to its bar's number, newest finish first. Escape returns focus to the bar. At 375px the page has no horizontal scroll and the decade chart scrolls inside its card. All five themes are readable, with a theme-coloured focus ring. A club rating sent `finishedOn` with the local date and stored it as midnight UTC.
- **On a phone the sheet is the `Modal` bottom sheet**: as tall as its list, full height only when the list is long. §3.5 said "fills the screen"; the bottom sheet is the site's pattern for every modal, so it stays.
- **Review:** the reviewer ran after Phases 1 and 2 (§6), so it wasn't run again. argos-security on the finished work found nothing: the sheet reads only the caller's own logs, every bad `kind`/`key`/`year` is a 400, no user text reaches SQL, and `finishedOn` is accepted only within a day of the UTC date and never overwrites a finish date.
- **Test plan:** `testing/stats-and-goals.md` steps G21–G47.
