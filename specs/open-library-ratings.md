# Feature Spec — Open Library ratings as a stand-in

**Status:** Built 2026-10-19 (Phases 1–2 and verification)

## 1. Problem

At launch nobody has rated anything on Winged Words, so every book page says "No ratings yet". Open Library has ratings for many works. Showing them, clearly labelled as Open Library's, gives a new reader something to go on until our own readers have rated the book.

Today Open Library ratings (`ratings_average`, `ratings_count` from search) only sort "Highest rated" in book search and on author pages (`BookService.Bayesian`, `AuthorWorksSort.HighestRated`). They are never shown.

## 2. Decisions (talked through 2026-10-19)

1. **Source: Open Library.** Goodreads closed its API in 2020 and StoryGraph has none. Google Books and Hardcover would be a second outside service, against SPEC §5 ("Open Library only through `OpenLibraryClient`").
2. **Kept apart from ours.** A separate, labelled line ("Open Library: 3.9 ★ from 121 ratings"), never mixed into the Winged Words average, the rating chart, "Highest rated" in our own data, or any stat.
3. **A stand-in, switched book by book.** A book with fewer than **10** counted Winged Words ratings shows the Open Library line. From 10 it shows only ours. No site-wide switch-off date. 10 is a constant that can be tuned.
4. **Hidden under 5 Open Library ratings.** "5.0 from 1 rating" says nothing. Many lesser-known books will have no rating on either site and keep showing "No ratings yet".
5. **Stored on `Book`, not fetched live.** Book pages keep working when Open Library is down (SPEC §5), and a rating a few weeks old is fine. Fetching live with an in-memory cache (as the edition picker does) was rejected: the rating is read on every book page view.
6. **Only the average and the count.** Open Library readers give whole stars (1–5), no halves, so its five-step breakdown doesn't match our ten half-star columns. Its breakdown is not shown or stored.

### The two scales

Our ratings are stored as 0.5–5 in half steps (`Log.Rating`), Open Library's as whole stars 1–5. Both averages are on the same 0–5 star scale, so they sit side by side with no conversion. Open Library's lowest rating is 1★ and ours ½★, so a disliked book can average slightly lower with us; another reason not to mix them. If a combined number is ever wanted, weight each average by its count; the values need no conversion.

## 3. Design

### 3.1 Open Library

`GET https://openlibrary.org/works/{id}/ratings.json`:

```json
{ "summary": { "average": 3.95, "count": 121, "sortable": 3.72 },
  "counts": { "1": 11, "2": 6, "3": 18, "4": 29, "5": 57 } }
```

Only `summary.average` and `summary.count` are read. A work nobody rated answers `count: 0`; its `average` may be missing or 0, so the average is only read when the count is above 0.

### 3.2 Data

Two nullable columns on `Books` (migration `AddOpenLibraryRatings`):

- `OpenLibraryRatingAverage double precision null`
- `OpenLibraryRatingCount integer null`

`open_library_rating_count` null means "not fetched yet"; 0 means "fetched, nobody rated it". The average is stored as Open Library gives it and rounded only for display.

### 3.3 Fetching

- `OpenLibraryClient` gets a private `FetchRatingsAsync(workId)`, built like `PickEditionCoverAsync`: best-effort, its own short timeout (3 s), any failure returns "not read" and never fails the book fetch or the refresh. It runs alongside the editions and author look-ups, so a new book page waits no longer.
- **Checked before storing** (Open Library is a public wiki): count 0 to 10,000,000, average 1 to 5 and present when count > 0 (`OpenLibraryRating.From`).
- **Three outcomes** *(changed after the reviews, 2026-10-19)*: a rating read; a **definite but unusable** answer (404, a body that isn't JSON, or one the checks reject); or a **failed** fetch (timeout, any other HTTP error, network error). Failures log one line without a stack trace, since a backfill asks thousands of times.
- **First cache (`GetBookAsync`):** a read rating is stored; a definite but unusable answer stores "nobody rated it" (count 0); a failure leaves both null. The 3 s limit (`RatingsTimeout`) applies here only.
- **Refresh (`RefreshBookAsync`):** a read rating replaces the stored one; a definite but unusable answer turns a never-fetched rating into 0 and keeps an existing one; a failure keeps everything. Only the client's own 10 s limit applies: the refresh job is paced (one request a second), the queue wait would count against 3 s, and nobody waits for a refresh (security review).
- **Backfill:** `GetStaleBooksAsync` also picks books whose count is null and that were cached over a week ago (`BookRepository.RatingRetryAfter`), within the existing 500-books-a-run cap and pacing. A definite answer ends a book's backfill; a failed one is tried again a week later rather than every daily run (reviewer: otherwise a broken endpoint would re-refresh every book daily). Books cached in the week before this shipped wait up to a week.

### 3.4 API

`GET /api/books/{openLibraryId}/ratings` (`RatingSummaryDto`) gains:

- `openLibraryAverage: number | null` (rounded to 2 places)
- `openLibraryCount: number | null`

Both are set only when the book has fewer than `OpenLibraryStandInUntil` (10) counted Winged Words ratings **and** at least `MinOpenLibraryRatings` (5) Open Library ratings; otherwise both are null. The server decides, so the page only shows what it gets. The book page doesn't need to wait for any new request.

### 3.5 Book page

Inside the existing "What readers think" card, after our summary, chart and "You rated it", a small block under a hairline *(built as a block, not the planned one-liner "3.9 ★ on Open Library · from 121 ratings": DESIGN.md bans middle-dot strings joining different facts)*:

> **4.2** ★
> Average rating on [Open Library](https://openlibrary.org/works/OL66554W)
> from 412 ratings

- The value in the display face at `--font-size-xl` (ours is `--font-size-display`, so ours stays the first thing read when there is one), tabular figures, one decimal (`formatDecimal`), a small gold star; the label `--font-size-sm` 500 like ours; the count muted.
- "Open Library" links to the work's page there (new tab, `rel="noreferrer"`, like the footer's credit): it credits the source and lets a curious reader check it.
- When we have no ratings, "No ratings yet" becomes "No ratings on Winged Words yet" (only when the block shows) so the two don't contradict each other.
- Screen readers hear "4.2 out of 5 stars" (visually hidden, `rating.outOfFive`), then the label and the count.
- Nothing new on cards, shelves or search results in this spec (§4).

### 3.6 Texts (all five languages, `rating.json`)

- `rating.openLibraryLabel`: "Average rating on <a>Open Library</a>" (`Trans`, so the link sits inside the sentence)
- `rating.noneHere`: "No ratings on Winged Words yet"
- Reused: `rating.outOfFive`, `rating.fromCount`

## 4. Out of scope

- Showing Open Library ratings on book cards, shelves, lists or search results (the stored columns make this cheap later).
- Using the stored rating for sorting our own data.
- Open Library's star-by-star breakdown.
- Any other rating source.

## 5. Tasks

### Phase 1 — Backend ✅ 2026-10-19

- [x] `Book.OpenLibraryRatingAverage`, `Book.OpenLibraryRatingCount`; migration `AddOpenLibraryRatings`
- [x] `OpenLibraryRatingsResponse` DTO; `FetchRatingsAsync` (timeout, checks, best-effort) in `GetBookAsync` and `RefreshBookAsync`
- [x] `GetStaleBooksAsync` also picks books with no rating fetched yet
- [x] `RatingSummaryDto.OpenLibraryAverage/OpenLibraryCount`, set in `ReviewSocialService` under the two thresholds
- [x] Tests: fetch kept / not read / out of range / failure keeps old values; stale query; summary thresholds (9 vs 10 ours, 4 vs 5 theirs, never fetched)
- [x] Review: `reviewer` + `argos-security` (outside API data stored and shown)
- [x] Fixed (reviewer): a book whose rating could never be read was fully re-refreshed every day. Definite-but-unusable answers now store 0 and failures retry after a week (§3.3); failures log without stack traces; tests added for `count: 0, average: 0`, unusable vs failed answers, the week's wait, and the endpoint (`ReviewSocialTests`: a Private rating isn't counted, so the stand-in shows).
- [x] Fixed (argos-security): the 3 s limit included the paced refresh's queue wait, so most backfill fetches would have timed out; a refresh now uses only the client's own timeout (test `Refresh_WaitsLongerThanTheReadersTimeout`).
- [x] Left as is (argos-security): an import's first fetch is paced too and can still hit the 3 s limit; that book gets its rating from the backfill a week later. The editions request (`EditionsTimeout`) has the same queue-wait effect, from before this spec.

### Phase 2 — Frontend ✅ 2026-10-19

- [x] Read `PRODUCT.md`, `DESIGN.md`; short plan per the `web-design` skill
- [x] Types; the Open Library line and "No ratings on Winged Words yet" in `RatingSummary`
- [x] Texts in all five languages
- [x] Tests: `RatingSummary` shows the line, hides it when null, the link and its accessible name
- [x] Screenshot critique round (`scripts/shoot.mjs`), then `reviewer`
- [x] Critique round (Le petit prince with none of ours, Pride and Prejudice with 9; Paper and Dark at 1280 and 375) changed nothing: ours stays the largest number when there is one, the block reads value → label → count in both themes, the link and the star keep their contrast in Dark, nothing overflows at 375. `design-reviewer` skipped: one small block inside an existing card.
- [x] Fixed (reviewer): the average is formatted once; a test checks every language keeps the `<a>Open Library</a>` link (the key check wouldn't notice it gone).
- [x] Left as is (reviewer): the link doesn't announce that it opens a new tab; the site has no such text yet and the footer's Open Library link behaves the same. Worth doing for every external link at once.

### Verification

- [x] Backend tests (1044), `npm test` (900), `npm run build`, `npm run lint`
- [x] Browser check on a side API (port 5260, current build, dev database): the migration applied at start; the refresh job backfilled five books (The Hobbit 4.30 from 504, Pride and Prejudice 4.21/412, Le petit prince 4.35/255, Dracula 4.00/251, Fantastic Mr Fox 3.95/121); two merged works answered count 0 and were stored as 0; the endpoint gave the stand-in for 0, 3 and 9 of ours and none for The Hobbit's 16. "Fewer than 5 Open Library ratings" is covered by the endpoint test, not seen live.
- [x] SPEC.md §7 `Books` columns; CHANGELOG; roadmap box
