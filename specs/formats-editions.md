# Feature Spec — Formats and editions

**Status:** ✅ All three phases done 2026-10-13: better default cover, your edition, format and audiobooks. Roadmap Stage 11 item 1 (series split out to its own item, see §4).

## 1. Problem

A `Book` in Argos is an Open Library *work*: one record with one `CoverUrl` and a flat `Isbns` list. There is no edition and no format.

- **Wrong covers.** The cover is the first valid id in the work's `covers` list (`OpenLibraryClient.ExtractCoverUrl`), which can belong to any edition. Solaris showed the Turkish one.
- **No "which edition did I read".** A reader of a Spanish translation, or of a 300-page edition when another is 500 pages, can't say so. The page count has to be typed by hand.
- **Audiobooks don't fit.** Progress is only pages. A listener has nowhere honest to put "4 h 10 m of 12 h", and stats, goals and club progress all assume pages (`StatsOverviewCalculator`, `ReadingGoalService`, `ClubService` member progress, `lib/clubPace.ts`).

Readers name "the right cover/edition" and "audiobooks by hours and minutes" among the gaps (`PRODUCT-ANALYSIS.md` #9). Other apps' complaints are mostly the same failure: rating or read status not carrying across editions, duplicate entries, the site's default edition replacing yours (Goodreads, StoryGraph, Hardcover; researched 2026-10-13).

## 2. Decisions

Agreed 2026-10-13:

- **The work stays the unit.** Logs, ratings and reviews stay on the work, so the average is pooled and nothing can split into "two books". The edition is a detail *of a log*.
- **Several logs per book stay** (rereads, as today, SPEC.md §3). Each log has its own edition and format, so a reread can be a different edition or the audiobook.
- **Two layers of cover.** The shared book gets an *automatic* default (nobody's pick changes it for everyone). A reader's chosen edition shows **only on their own reading screens**; everyone else sees the shared cover.
- **No `Edition` table.** The chosen edition is a snapshot in a few nullable columns on `Log`, like `TotalPages` already is. A table is only worth it if "readers of this edition" is ever wanted; the columns can be moved into one then.
- **Audio gets its own fields**, never page fields, so a 12-hour audiobook can't count as 720 pages.
- **Order:** better default cover → your edition → format and audiobooks.

Chosen without asking (small, easy to change):

- A new log of a book you've logged before starts with **your previous log's edition and format**.
- Picking an edition **fills `TotalPages`** from it only when the log has no page count yet; a number you typed is never overwritten.
- No mass backfill of covers: existing books improve when the background refresh (`OpenLibraryCacheRefreshService`) next reaches them.
- **Search thumbnails may differ from the book page cover.** Search results use Open Library's own `cover_i`; fixing that would cost one extra request per result.
- For audio members in a club, a page-based checkpoint is placed as a percentage of the **median page count of the members who have one**; with none, no marker is shown for them.

## 3. Design

### 3.1 Phase 1 — Better default cover

`OpenLibraryClient`, on a cache miss (`GetBookAsync`) and on refresh (`RefreshBookAsync`):

1. Fetch `/works/{id}/editions.json?limit=100` with a short timeout (3 s; a page is ~70 KB and ~1.2 s).
2. The **original language** is the one translations most often name in `translated_from`. Take that language's **oldest** edition with a valid cover that isn't itself a translation (no `translated_from` / `translation_of`).
3. Fall back to: the oldest **English** edition with a cover (translations allowed) → today's rule (first valid id in the work's `covers`). Never a cover in some third language.
4. **Best-effort.** Any failure or timeout keeps today's rule on a first fetch; on a refresh it keeps the **stored** cover (an earlier edition pick beats the work's own). The book fetch never fails because of it.

*Changed after the real-book check (2026-10-13):* the first rule ("most common language among non-translated editions", then "oldest edition with a cover", 50 per page) picked a Turkish cover for Le petit prince and a Spanish one for Anna Karenina. Most translations on Open Library carry no `translated_from`, and the page favours recently added editions. The languages that translations name were right for every book that had any. See *Phase 1 results* below.

The picking rule is a pure static method (`EditionCoverPicker`), unit-tested on recorded Open Library responses. No schema change: the result is still stored as `CoverUrl`.

Each refreshed or newly cached book costs one extra Open Library request. Live search is unchanged.

Frontend: find large cover displays still using the `-M` URL and pass them through `largeCoverUrl` (`web/src/lib/coverUrl.ts`). Small thumbnails stay `-M`.

### 3.2 Phase 2 — Your edition

**Data model:** nullable columns on `Logs`:

| Column | Type | Note |
|---|---|---|
| `EditionOpenLibraryId` | `string?` (≤ 20) | `OL…M`, checked by regex |
| `EditionCoverId` | `int?` | > 0 |
| `EditionLanguage` | `string?` (≤ 10) | Open Library language code, e.g. `spa` |
| `EditionPublisher` | `string?` (≤ 200) | first publisher |
| `EditionYear` | `int?` | parsed from `publish_date` |

All null = "no edition chosen" (every existing log). No backfill.

**Open Library:** `IOpenLibraryClient.GetEditionsAsync(workId)` returns editions **with a cover**: edition id, cover id, language, publisher, year, page count, format. Cached in memory for a few hours per work (`IMemoryCache`). Open Library unreachable → an empty list and the picker says so.

**Choosing an edition:** the client sends only `editionOpenLibraryId` on create/update log. The server looks it up in `GetEditionsAsync` for **that log's work** and copies the fields from there. It never trusts cover id, language or pages sent by the client, and rejects an edition that doesn't belong to the work (new error code + translation). Sending `null` clears it.

**Endpoint:**
```
GET /api/books/{openLibraryId}/editions → the editions with covers, newest first
```
Logged-in only, as the picker is only on the log form.

**Import:** the ISBN lookup already fetches the edition (`FindWorkIdByIsbnAsync` reads `/isbn/{isbn}.json`). It also returns the edition fields, and an imported log gets them plus the page count. No extra request. ISBN matches from Argos's own cache (no Open Library call) get no edition.

**Account export:** the edition columns go into the logs file.

**Where your edition's cover shows:** `LogDto` and the reader's own shelf, journal, profile shelf, stories and log form use the edition cover when set, else the book's. Every other screen (book page, feed, lists, clubs, reviews, landing, search) keeps the shared cover. Visibility follows the log's `ReadingVisibility`, like everything else on it.

**Frontend:**
- Log form: an "Edition" row showing the current one (cover, language, publisher, year) with **Change**. It opens a picker listing the editions (filter by language), and a "No specific edition" option.
- A new log defaults to your last log of that book's edition (decided server-side in `LogService` when the request leaves it out).
- All text through `t()` in five languages; design tokens only; checked at phone width.

### 3.3 Phase 3 — Format and audiobooks

**Data model:** on `Logs`:
- `Format`: `Print` / `Ebook` / `Audio`, nullable (= not said).
- `TotalMinutes`, `CurrentMinute`: `int?`, only allowed when `Format = Audio` (≤ 10,000 minutes).
- With `Audio`, `TotalPages` / `CurrentPage` are cleared and refused, so pages and minutes never mix on one log.

An edition whose Open Library `physical_format` says audio pre-selects `Audio` in the form.

**One place that knows the progress:** `ReadingProgress.Percent(log)` (pages or minutes) used by the log card, stories, club progress and the feed's progress items, instead of each computing pages ÷ total.

**Stats and goals:**
- Pages totals, longest and shortest only count non-audio logs. Audio finished logs are not in "books without a page count".
- New `minutesListened` in the stats overview, shown as hours.
- A books goal counts audiobooks like any book. A pages goal ignores them, and the goal card says how many audiobooks were left out.

**Clubs:** member progress is a percentage for everyone. For audio members, `lib/clubPace.ts` places a page checkpoint by the rule in §2. On track / Behind works the same way.

**Frontend:** format selector on the log form; hours:minutes inputs for audio (stored as minutes); progress modal, log card and stories show "4 h 10 m of 12 h"; stats page shows hours listened. Five languages.

## 4. Explicitly out of scope

- **Series** ("Book 3 of 7"). Open Library has no structured series on works, only a free-text field on some editions, and Argos has no librarians to correct it. Needs its own spec and data model: new Roadmap Stage 11 item.
- An `Edition` table, "readers of this edition", per-edition ratings or reviews.
- Choosing the shared default cover by the viewer's language (a cover per book per language on every screen).
- Different covers in search results.
- Progress in several formats at once for one reading (switch format mid-book). One log has one format; a new format can be a new log.

## 5. Tasks

### Phase 1 — Better default cover
**Backend**
- [x] `EditionCoverPicker` (pure) + unit tests: original vs translations, no `translated_from` anywhere, no covers, invalid ids, English fallback
- [x] `editions.json` fetch in `GetBookAsync` and `RefreshBookAsync`, timeout, fallback to today's rule; tests with a fake handler (timeout, 500, bad JSON)

**Frontend**
- [x] Large cover displays still on `-M` switched to `largeCoverUrl`

**Verification**
- [x] Check ~20 real books (Solaris, translated classics, an English original, a book with no covers) against the live API and note the result here
- [x] Reviewer

**Phase 1 results (2026-10-13).** Built in `EditionCoverPicker` and `OpenLibraryClient` (editions fetched alongside the author look-ups, `int?` cover lists because real pages contain `[null]`). `ExtractYear` now takes the first four-digit year ("Jun 29, 1981" used to become 2919). `BookCover size="large"` (book page, review page, profile favourites) uses the `-L` image; story covers (7rem) stay `-M`. Tests: 13 picker cases from recorded responses, 9 client cases (500, bad JSON, network error, unexpected error, timeout, empty page, refresh keeps the stored cover); full suite 762 passing.

22 books against live Open Library with the final rule:

| Book | Before | After |
|---|---|---|
| Solaris | unlabelled 1997 edition | Polish 1961 first edition |
| Crime and Punishment | Russian | Russian 2007 |
| Don Quixote | ? | English 2000 (no `translated_from` on the page) |
| One Hundred Years of Solitude | German | Spanish 1982 |
| Le petit prince | work cover | work cover (only Danish/Turkish/Portuguese covers on the page) |
| Anna Karenina | English | English 1956 (no Russian cover on the page) |
| L'étranger | French | French 1955 |
| Les Misérables | marbled endpaper scan | French 1903 binding |
| The Trial | work cover | work cover |
| Madame Bovary | French | French 2005 |
| Il nome della rosa | English | Italian 1980 first edition |
| Norwegian Wood | German | Japanese 1987 first edition |
| My Brilliant Friend | Italian | Italian 2011 |
| Dune | English | English 1965 first edition |
| Pride and Prejudice | plain binding | plain binding (1813) |
| Nineteen Eighty-Four | plain binding | plain binding (1949) |
| The Hobbit | English | English 1966 |
| The Great Gatsby | plain | English 2011 illustrated |
| Beloved, Project Hail Mary, La sombra del viento | original | original (same design) |
| Pedro Páramo | title-page scan | Spanish 1965 |
| *List of Staffordshire parish registers transcripts* (no covers) | none | none |

Language is right in every case. Two things to know: English readers now see original-language covers for translated books (Polish Solaris, Japanese Norwegian Wood), as decided in §2; and "oldest" sometimes means a plain cloth binding (Pride and Prejudice, 1984), as before. Reviewer findings fixed: a failed editions call on refresh no longer replaces a stored edition cover with the work's own, and any exception from the editions call is caught. Kept: the 3 s timeout.

### Phase 2 — Your edition
**Backend**
- [x] Migration: edition columns on `Logs`
- [x] `GetEditionsAsync` + memory cache, `GET /api/books/{id}/editions`
- [x] Create/update log: `editionOpenLibraryId` checked against the work, fields copied server-side, page-count fill rule, previous-edition default; error code + translations
- [x] `LogDto` edition fields and edition cover on the reader's own screens
- [x] Import sets the edition from the ISBN lookup; export includes it
- [x] Integration tests: pick, wrong-work edition refused, client fields ignored, typed page count kept, reread default, privacy follows `ReadingVisibility`

**Frontend**
- [x] API client + types; edition row and picker on the log form
- [x] Edition cover on shelf, journal, profile shelf, stories
- [x] Translations (five languages) and Vitest tests

**Verification**
- [x] Browser check (phone width, five themes)
- [x] Reviewer; argos-security (user input reaching the server, external API call)

**Phase 2 results (2026-10-13).** Built as specified, with these choices:

- *Left out vs null.* `editionOpenLibraryId` left out of the request means "keep it" (update) or "your last log of this book's edition" (create); `null` means "no specific edition". The request DTOs record whether the field was in the JSON (`EditionSpecified`), so quick updates that send the rest of the log (QuickLog, progress) never clear the edition. Sending the log's current edition again needs no Open Library call.
- *Where it's looked up.* `EditionService` (Api) holds the cache: 6 hours per work in `IMemoryCache`; a failed fetch isn't cached. `GetEditionsAsync` reads up to 500 editions in one request (~350 KB, ~2 s; One Hundred Years of Solitude has 4,042 editions, 118 of the first 500 with a cover). Works with more show the first 500 Open Library returns. Two error codes: `logs.editionNotOfBook`, `logs.editionUnavailable`.
- *Covers.* The server puts the edition's cover into `bookCoverUrl` on `LogDto`, `JournalEntryDto` and the stories' `ActivityItemDto`, so the shelf, journal, profile shelf, rail and stories needed no frontend change. `LogDto` also carries the edition fields; they're seen by whoever may see the log.
- *Pages.* An edition's page count fills an empty page count, never a typed one, and not when the reader is already past it. The previous-edition default doesn't fill pages (the snapshot doesn't keep them).
- *Import.* The ISBN's edition (with or without a cover) goes on the current read only, like the page count; the file's page count wins.
- *Form.* `EditionField` shows the current edition (or, for a new log, the last reading's, from the logs query the book page already has) with Change, which opens an inline list: "No specific edition", then the editions newest first, with a language filter when there's more than one language. Language names come from `Intl.DisplayNames`, with Open Library's bibliographic codes (`ger`, `fre`…) mapped first (`lib/editionLanguage.ts`). Picking fills an empty page count in the form too. Hidden where the form doesn't know the work (the progress modal opened with only a book id).
- Tests: `EditionTests` (integration, incl. the endpoint's id and known-book rules), one import test, `OpenLibraryEditionsTests` (client), `EditionField.test.tsx` and `editionLanguage.test.ts`. Backend 790 passing on a private test database, frontend 694.
- Browser check: One Hundred Years of Solitude on side ports, desktop and 375 px, all five themes, no horizontal overflow; the journal and the "Currently reading" rail show the picked edition's cover, and a second log of the book starts with it.

**Phase 2 review fixes.** Nothing blocking. Fixed:
- One odd value in a wiki record (`"number_of_pages": "300"`) no longer fails the whole editions page: the edition fields Phase 2 reads are parsed leniently (`LenientJson.cs`), and the ISBN lookup reads the work apart from the edition, so a bad edition can't turn an import row into "Open Library unavailable".
- The editions endpoint only serves books already in `Books` (404 otherwise), and the work-id check is now `^OL[0-9]{1,20}W\z` (no other scripts' digits, no trailing newline, capped). So a script can't fill the memory cache with arbitrary ids. A work Open Library answers 404 for is an empty, cacheable list, not an outage.
- A publisher name is never cut inside an emoji; an invalid edition id from a client isn't written raw to the server log.
- The previous-edition default copies the newest log's edition, "none" included, so choosing no edition sticks.
- In the form, a page count filled from an edition follows later picks (and "none" clears it) until the reader types one. On the server, an edition's fill of the page count moves `ProgressUpdatedAt` like a typed one.
- `Log.cs` comment and SPEC.md (§3 Log row, §7 `Logs` columns, editions cache) brought in line.

Kept: a create of a Read log with an edition gets the edition's page count even though the form only shows pages for Currently reading / DNF (useful for stats later); Open Library unreachable answers 400 `logs.editionUnavailable`, like other upstream failures.

### Phase 3 — Format and audiobooks
**Backend**
- [x] Migration: `Format`, `TotalMinutes`, `CurrentMinute`; validation (audio ↔ minutes only)
- [x] `ReadingProgress.Percent` used everywhere progress is computed
- [x] Stats overview and goals: pages exclude audio, `minutesListened`, audiobooks-left-out count
- [x] Club member progress as a percentage; export includes the new fields
- [x] Integration tests: audio never adds pages, mixed-format club, goal counts

**Frontend**
- [x] Format selector, hours:minutes inputs, progress display in log card, progress modal and stories
- [x] Stats hours listened; goal card note; `lib/clubPace.ts` audio rule with unit tests
- [x] Translations (five languages) and Vitest tests

**Verification**
- [x] Browser check (phone width, five themes, an audio log in a club)
- [x] Reviewer; argos-security
- [x] Manual test plan `testing/formats-editions.md` (`test-plan` skill)
- [x] CHANGELOG line, ROADMAP item ticked, `FUTURE-IDEAS.md` cover/edition idea marked done

**Phase 3 results (2026-10-13).** Built as specified, with these choices:

- *Data.* `ReadingFormat` (`Print`/`Ebook`/`Audio`, stored as an int, null = not said) and `TotalMinutes`/`CurrentMinute` on `Logs` (migration `AddLogFormat`, three nullable columns, no backfill). `LogService.ValidateFormat` refuses minutes on anything but an audiobook and pages on an audiobook (≤ 10,000 minutes, position ≤ length); six new error codes (`logs.invalidFormat`, `minutesOnlyAudio`, `audioNoPages`, `totalMinutesRange`, `currentMinuteRange`, `currentMinuteOverTotal`). An edition's page count never fills an audiobook.
- *Left out vs null.* As with the edition, the request DTOs record whether `format` was in the JSON: left out keeps it on update (so QuickLog and other partial updates never lose it) and, on create, takes the newest earlier log's format, unless that was audio and the new log comes with page numbers. Minutes are sent as the full value, like pages.
- *One percentage.* `ReadingProgress.Percent` (Domain) for club progress and club activity; `lib/readingFormat.ts` `progressPercent`/`progressText` in the browser (log card, stories, club card). Both round halves up.
- *Finished audiobooks keep their length* ("Finished!" and the form clear only the position), because stats add up `TotalMinutes`. Stats: `minutesListened` and `audiobooks` on the overview, shown as an "Hours listened" tile when there is at least one; pages totals, longest/shortest and "without a page count" skip audio. Goals: a pages goal leaves audiobooks out and `audiobooksLeftOut` says how many; a books goal counts them.
- *Clubs.* `ClubMembershipDto` carries format and minutes. `lib/clubPace.ts` `referencePages` takes the median page count of the members reading in pages; an audio member's marker and On track / Behind are measured against it, and with none there is no marker and the member counts as on track.
- *Form.* A Format select (Not said / Print / Ebook / Audiobook) under Edition. For an audiobook, "Length" and "Listened so far" (or "Stopped at") as hours + minutes (`DurationInput`), stacked so they fit a phone; on a Read log only the length. A new log shows the format of your last reading of the book (until those logs load, `format` is left out and the server picks the same). Picking an edition whose `physical_format` is a recording (audio, cassette, MP3, sound recording, Audible; not a bare "CD") pre-selects Audiobook when no format is set. The quick log on an audiobook offers "+15 min" and shows "4 h 10 m of 12 h".
- Tests: `FormatTests` (integration: rules, left-out format, reread default, the Readings strip moving, stats and goal counts, export), a mixed-format club test, an audiobook-edition test, `ReadingProgressTests` (unit); `readingFormat.test.ts`, `LogFormFormat.test.tsx`, audio cases in `clubPace.test.ts` and `quickLog.test.ts`. Backend 809 passing on a private test database, frontend 700+.
- Browser check: an audiobook reader and a print reader in one club on side ports, 375 px in all five themes and desktop: quick log, new-log form (format pre-filled from the last reading), story label, stats tile, goal note, club bars with the audio marker at 25%. No horizontal overflow.

**Phase 3 review fixes.** Security: nothing found (enum/range checks hold, no new privacy path; club progress already ignores reading privacy, `bugs/club-progress-ignores-reading-visibility.md`, and now also shows a private audiobook's minutes, so its fix must hide those too). Reviewer, all low: server rounding now matches the browser (halves up); the test fake passes format and minutes; a bare "CD" no longer counts as audio; the new-log form leaves `format` out until your last reading has loaded.

Left for later: the club checkpoint reminder (`NotificationRepository`) still judges by page only, so an audio member can be reminded although on track; the "Currently reading" rail card (`RailCards.tsx`, built in another session) still shows pages only; the landing page's demo card is sample data and stays in pages.
