# Feature Spec — Import from Goodreads and StoryGraph

**Status:** 📝 Spec written 2026-10-07. Roadmap Stage 2. Not started.

Replaces Phase 6 of `specs/account-system.md` (the Goodreads-only import), which was never built. That phase's decisions (§2 "Goodreads import", §3.11) are carried over here and extended, so this file is the only one to follow.

## 1. Problem

A reader with years of history on Goodreads or StoryGraph won't start again from an empty shelf. Readers also complain that imports elsewhere lose things: private notes, read dates, rereads, shelves, and books that quietly didn't match. Argos can't import anything today.

## 2. Decisions

**Asked 2026-10-07:**
- **Private notes get a home.** Logs gain a **private note** that only its author ever sees. Goodreads' "Private Notes" go there. It's also editable in the log form, so it's useful outside the import.
- **One log per read.** Argos already keeps one log per reading (a reread is another log with `IsReread`). A book read 3 times becomes 3 logs. The latest read gets the date, rating, review and private note; earlier reads are Read logs with no rating or review. StoryGraph exports every read's dates, so its logs get real dates; Goodreads only exports the last date, so its earlier reads are undated.
- **The results screen shows two groups to fix:** books that didn't match ("Find it" or "Skip"), and books matched only by title, which might be the wrong book ("Looks right", "Change" or "Remove"). Nothing is silently dropped or silently wrong.
- **Imported reviews use your review privacy default**, like any new review.

**Carried over from the account spec:**
- **The import runs in the background.** The CSV is uploaded (10 MB max), parsed at once into one import job with one row per book, then worked through slowly so Open Library isn't flooded. The page polls for progress every 2 seconds; the reader can close it and come back.
- **Books already on your shelves are skipped, never overwritten**, so importing the same file twice is safe.
- **An import can be undone for 7 days.** Undo deletes exactly the logs and lists it created.
- **Importing needs a confirmed email**, because it can publish reviews.
- **Goodreads custom shelves become private Argos lists.**

**Decided while writing this spec (change any before building):**
- **One upload, the file says which app it's from.** A Goodreads export has an `Exclusive Shelf` column, a StoryGraph export has `Read Status`. Anything else is refused with "This doesn't look like a Goodreads or StoryGraph export."
- **Imports don't fill the Feed.** The Feed's activity rows (`specs/feed-redesign.md`) would otherwise say "finished 400 books just now". Imported logs record **no activity events and no club progress**, and their `CreatedAt` / `ProgressUpdatedAt` are the original "Date Added", so they also don't jump to the front of the Readings strip. Reviews already sort by `ReviewedAt`, which is the original date.
- **StoryGraph's quick questions come across.** Argos's moods, pace, plot/character and content warnings were modelled on StoryGraph's, so they map almost one to one (§3.3). Unknown values are dropped quietly.
- **StoryGraph tags become private lists**, like Goodreads shelves.
- **Too-long text is shortened, not refused.** A review over 10,000 characters or a private note over 5,000 is cut, and the row says so ("Review shortened to 10,000 characters"). Refusing the whole book over it would be worse.
- **One import at a time per reader.** Starting a second while one runs is refused.
- **Import data is deleted 30 days after the import finishes.** The rows hold copies of reviews and private notes; keeping them forever isn't needed. The logs and lists created stay, of course. After 7 days undo is gone; after 30 the import disappears from the list.
- **The uploaded file itself is never stored**, only the parsed rows.

## 3. Design

### 3.1 Data model

`Log` gains:
| Field | Type | Purpose |
|---|---|---|
| `PrivateNote` | `string?`, max 5,000 | Only the author sees it (§3.6) |

New tables:
- **`ImportJobs`**: `Id`, `UserId` (cascade), `Source` (`Goodreads` / `StoryGraph`), `Status` (`Queued` / `Running` / `Completed` / `Failed` / `Undone`), `TotalRows`, `ProcessedRows`, `CreatedAt`, `FinishedAt?`, `UndoneAt?`. Index on `(UserId, CreatedAt)`.
- **`ImportRows`**: `Id`, `ImportJobId` (cascade), `RowNumber`, `Title`, `Author`, `Isbn13?`, `Isbn10?`, then the mapped fields as one `jsonb` column `Data` (status, rating, review, spoiler, private note, reads with dates, pages, moods, pace, drive, warnings, list names). Then `Result` (`Pending` / `Imported` / `MatchedByTitle` / `AlreadyOnShelf` / `NotFound` / `Error` / `Skipped`), `Message?`, `BookId?` (the match), `CreatedLogIds` (`uuid[]`), `Resolved` (bool: "Looks right" or fixed). Index on `(ImportJobId, Result)`.
- **`ImportCreatedLists`**: `ImportJobId`, `BookListId` (key on both; cascade from both sides). Used by undo.

Why `jsonb` for the mapped fields: they're written once at upload and read once by the worker, never queried, and the two sources carry different fields.

### 3.2 Reading the files

`ImportCsvReader` (CsvHelper) reads the header, picks the source, and hands each row to `GoodreadsRowMapper` or `StoryGraphRowMapper`. Columns are found **by name**, not position, and only these are required: Goodreads `Title`, `Author`, `Exclusive Shelf`; StoryGraph `Title`, `Authors`, `Read Status`. Every other column is optional, because neither app documents its format and both have changed it before. Limits: 10 MB, 20,000 rows, each field capped at a sane length. A file that fails these is refused with a 400 before anything is saved. Dates are accepted as `yyyy/MM/dd` or `yyyy-MM-dd` and stored the way the log form stores them.

**StoryGraph's exact format is not documented anywhere public.** The columns below come from converters people have written. Before Phase 1 is ticked, check the mappers against a real StoryGraph export and fix this section.

### 3.3 Mapping

**Goodreads** (columns as of 2026: `Book Id`, `Title`, `Author`, `Additional Authors`, `ISBN`, `ISBN13`, `My Rating`, `Number of Pages`, `Date Read`, `Date Added`, `Bookshelves`, `Bookshelves with positions`, `Exclusive Shelf`, `My Review`, `Spoiler`, `Private Notes`, `Read Count`, …)

| Goodreads | Argos |
|---|---|
| `ISBN13`, `ISBN` | Matching. Goodreads writes them as `="9780441013593"`; strip the `="` and `"`. Kept only if the checksum is valid. |
| `Exclusive Shelf` `read` / `currently-reading` / `to-read` | Read / Currently reading / Want to read |
| Custom exclusive shelf named like `dnf`, `did-not-finish`, `abandoned`, `dropped` | Did not finish |
| Any other custom exclusive shelf | Want to read, and a list with that shelf's name |
| `Bookshelves` (non-exclusive custom shelves) | One private list per shelf. Order from `Bookshelves with positions` when present, else file order. |
| `My Rating` 1–5 (0 = none) | Rating. Dropped on statuses that can't have one (only Read and DNF can). |
| `My Review` | Review text: `<br/>` → line break, other HTML removed. |
| `Spoiler` `true` | `HasSpoilers` |
| `Private Notes` | `PrivateNote` |
| `Date Read` | `FinishedAt` of the latest read |
| `Date Added` | `CreatedAt` and `ProgressUpdatedAt` of every log from this row; `ReviewedAt` when there's no `Date Read` |
| `Read Count` *n* > 1 | *n* − 1 extra undated Read logs before the latest one; the latest is marked `IsReread`. Assumes the count includes the current read for a currently-reading book: **check against a real export.** Capped at 10 logs per book. |
| `Number of Pages` | `TotalPages` |

**StoryGraph** (expected columns: `Title`, `Authors`, `Contributors`, `ISBN/UID`, `Format`, `Read Status`, `Date Added`, `Last Date Read`, `Dates Read`, `Read Count`, `Moods`, `Pace`, `Character- or Plot-Driven?`, `Star Rating`, `Review`, `Content Warnings`, `Tags`, `Owned?`, …)

| StoryGraph | Argos |
|---|---|
| `ISBN/UID` | Matching, only when it's a valid ISBN-10 or ISBN-13 (a StoryGraph-only ID is ignored, so title search is used) |
| `Read Status` `read` / `currently-reading` / `to-read` / `did-not-finish` / `paused` | Read / Currently reading / Want to read / Did not finish / Currently reading |
| `Dates Read` (one entry per read, each a start–finish pair) | One log per read with `StartedAt` / `FinishedAt`; the latest gets the rating and review, later ones `IsReread`. Falls back to `Last Date Read` + `Read Count` like Goodreads. |
| `Star Rating` (quarter stars, e.g. 3.75) | Rounded to the nearest half star (3.75 → 4.0, 3.25 → 3.5), since Argos uses half stars |
| `Review` | Review text, HTML removed as for Goodreads |
| `Moods` | Moods whose key matches Argos's list (`ReviewCatalog.Moods`), at most the first 3 |
| `Pace` `slow` / `medium` / `fast` | `Pace` |
| `Character- or Plot-Driven?` `Plot` / `Character` / `A mix` | `Drive` Plot / Character / Mix |
| `Content Warnings` (grouped as Graphic / Moderate / Minor) | Content warnings whose label matches Argos's list, with the same severity |
| `Tags` | One private list per tag |
| `Date Added` | As Goodreads |
| `Format`, `Owned?`, `Contributors`, the character questions | Ignored (formats are Roadmap Stage 11) |

Moods, pace, drive and warnings are review fields, so like the rating they're only kept on Read and DNF logs.

### 3.4 Matching a row to a book

In order, stopping at the first hit:
1. **ISBN in Argos's own book cache** (`Book.Isbns`). No Open Library request at all, which makes popular books fast.
2. **ISBN on Open Library**: `/isbn/{isbn}.json` gives the edition, its `works[0]` gives the work ID, then `GetBookAsync` caches the work as usual. ISBN-13 first, then ISBN-10. New method: `IOpenLibraryClient.FindWorkIdByIsbnAsync`.
3. **Title + author search** (`SearchAsync`). It counts only if the titles are equal after normalising (lower case, accents and punctuation removed, subtitle after `:` and "(Series #1)" dropped) **and** an author's surname matches. A hit is `MatchedByTitle`: imported, but listed under "Check these".
4. Otherwise `NotFound`.

If Open Library is unreachable, the row is retried twice (30 s, then 2 min). After that it's `Error` ("Couldn't reach Open Library") and appears with the not-found books, where "Find it" fixes it.

### 3.5 Processing

`ImportProcessingService : BackgroundService`:
- Takes the oldest `Queued` job, sets it `Running`, and works through its `Pending` rows in order. One job at a time for the whole site.
- **At most one Open Library request per second**, counted across the whole service (book lookups can take 2–4 requests: edition, work, authors). A 500-book library takes roughly 10–30 minutes; cached books are instant.
- Each row is saved on its own (row result + its logs + its list items in one transaction), so a crash loses at most one row.
- **Restart-safe:** on start-up, `Running` jobs carry on from their first `Pending` row.
- Lists are created when the job starts (one per shelf or tag name, private, description "Imported from Goodreads on 7 Oct 2026"), recorded in `ImportCreatedLists`, and filled as rows match. A book already on your shelves is still added to its imported lists: those lists are new, so nothing is overwritten.
- **Already on your shelves** = you have any log of that book, including one this same file created (two editions of one work in the file). Result `AlreadyOnShelf`, no logs created.
- Logs are written through a new `LogService.ImportAsync`: the same validation as `CreateAsync`, but takes the original dates and **records no activity events and no club progress**. A validation failure makes the row `Error` with the reason.
- A daily clean-up (in the same service) deletes jobs whose `FinishedAt` is over 30 days old.

### 3.6 The private note

- Stored on `Log.PrivateNote`, max 5,000 characters, trimmed, blank → null.
- **Returned only to the log's author.** `LogDto` gets `privateNote`, filled only when the viewer is the author; every other place a log appears (other readers' shelves, reviews, the Feed, activity, clubs, readings strip) never includes it. A test checks the public endpoints.
- Set through the existing create and update log requests. Allowed on every status.
- **Frontend:** a "Private note" field at the bottom of the log form, labelled "Only you can see this". On the book page, your own log shows the note under a lock icon.

### 3.7 Endpoints

```
POST   /api/imports                         multipart file (≤10 MB), confirmed email → 202 { jobId, source, totalRows }
GET    /api/imports                         your imports, newest first (counts per result, canUndo)
GET    /api/imports/{id}                    progress + counts
GET    /api/imports/{id}/rows?group=fix|check   rows to fix (NotFound + Error) or check (MatchedByTitle, not yet resolved)
POST   /api/imports/{id}/rows/{rowId}/resolve   { openLibraryId } → imports the row with that book
POST   /api/imports/{id}/rows/{rowId}/skip      NotFound/Error → Skipped
POST   /api/imports/{id}/rows/{rowId}/confirm   MatchedByTitle → "Looks right"
DELETE /api/imports/{id}/rows/{rowId}/logs      MatchedByTitle → "Remove": deletes the logs this row created
POST   /api/imports/{id}/undo               within 7 days, not while Running
```

- All need login and only touch your own imports (someone else's → 404).
- Upload: confirmed email (`[RequireConfirmedEmail]`), rate limit `auth` (existing policy), 409 if you already have a `Queued` or `Running` job. Each error gets a code in `ErrorCodes.cs`.
- **Resolve** on a `NotFound`/`Error` row creates the logs as the worker would. On a `MatchedByTitle` row ("Change"), it moves the logs and list items that row created to the new book, keeping any edits made since. If the chosen book is already on your shelves from elsewhere, it's refused with a clear error.
- **Undo** deletes the logs in every row's `CreatedLogIds` that still exist and the lists in `ImportCreatedLists`, then sets the job `Undone`. Logs and lists you created yourself are never touched.

### 3.8 Frontend

- **Settings → Privacy & data → "Import your books"** links to `/settings/import`.
- **Import page:**
  - How to get the file, for both apps: Goodreads: My Books → Import and export → Export Library. StoryGraph: Manage Account → Export StoryGraph Library. (Check the StoryGraph path against the real site.)
  - Upload (one file input; the page says which app it recognised).
  - Progress bar while running, polling `GET /api/imports/{id}` every 2 seconds, with "You can leave this page; the import keeps going."
  - **Results:** "312 imported · 14 already on your shelves · 9 to fix · 6 to check".
  - **To fix:** each book as the file had it (title, author), with "Find it" (the existing book search in a dialog) and "Skip".
  - **Check these:** the file's title and author next to the matched book's cover, title and author, with "Looks right", "Change" (same search dialog) and "Remove".
  - **Past imports** with date, app, counts, and "Undo this import" (with a confirm dialog) while allowed.
- Everything through `t('…')` in all five languages; styling from the design tokens; must work at phone width.

## 4. Out of scope

- Importing Goodreads Listopia lists or StoryGraph challenges (not in the exports), Letterboxd-style re-import of an Argos export, or other apps (Hardcover, LibraryThing, Fable).
- Book formats (paperback / ebook / audiobook): Roadmap Stage 11.
- Reading-journal entries (page-by-page history): Argos keeps one current page per log.
- Matching against anything except Open Library.
- Email when an import finishes (no notifications yet: Roadmap Stage 5).

## 5. Tasks

### Phase 1 — Backend

- [ ] `Log.PrivateNote` (migration, 5,000 max), in create/update requests, in `LogDto` only for the author; tests that no other endpoint returns it
- [ ] `ImportJobs`, `ImportRows`, `ImportCreatedLists` (migration)
- [ ] `ImportCsvReader` + `GoodreadsRowMapper` + `StoryGraphRowMapper`, with tests on realistic sample files (ISBN quirk, dates, HTML reviews, custom shelves, read counts, quarter stars, moods, warnings, missing optional columns, wrong file)
- [ ] `IOpenLibraryClient.FindWorkIdByIsbnAsync`; matcher (cache ISBN → Open Library ISBN → normalised title + author search)
- [ ] `LogService.ImportAsync` (original dates, no activity events, no club progress)
- [ ] `ImportProcessingService` (1 request/s, restart-safe, retries, lists, already-on-shelf, 30-day clean-up)
- [ ] Endpoints and error codes (§3.7)
- [ ] Tests: mapping tables, one log per read, duplicates skipped, re-import safe, resolve / change / skip / confirm / remove, undo removes exactly what the job created, confirmed email required, someone else's import is 404, nothing in the Feed's activity
- [ ] Check the mappers against a real Goodreads and a real StoryGraph export; fix §3.2–3.3 where they differ

### Phase 2 — Frontend

- [ ] Private note in the log form and on your own log on the book page
- [ ] Import page: instructions, upload, progress (2 s polling), results counts
- [ ] "To fix" and "Check these" groups with the search dialog
- [ ] Past imports with undo
- [ ] Translations in all five languages; tests for upload → progress → results → fix

### Phase 3 — Verification & docs

- [ ] Backend + frontend tests pass; build and lint clean; migrations applied to the dev database
- [ ] A real Goodreads export and a real StoryGraph export both import in the browser (`browser-check`), at desktop and phone width; every unmatched book can be found or skipped
- [ ] reviewer + argos-security (file upload, an external API, and the private note's privacy)
- [ ] Bruno: an Imports folder
- [ ] SPEC.md §10 (import done); `specs/account-system.md` Status line; ROADMAP Stage 2 ticks; CHANGELOG line

### Local setup needed

- Internet access for Open Library.
- A real Goodreads export (My Books → Import and export → Export Library) and a real StoryGraph export. Put them somewhere outside both repos: they contain your reviews and notes.
