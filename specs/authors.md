# Feature Spec — Authors: search, author pages, follow

**Status:** 🟡 Phase 1 built 2026-10-15 (author page, works grid, linked names, backfill). Phase 2 built 2026-10-15 (merged-id repair, Authors tab, stats, your history, friends; reviewed, see §7.2). Phase 3 built 2026-10-16 (follow, followed-authors list, new-release check, bell and Feed; reviewed, see §7.3). Phase 4 built 2026-10-16 (favourite authors, quotes by author; reviewed, see §7.4). Research and decisions come from the 2026-10-15 conversation; the first sketch is in `FUTURE-IDEAS.md` ("Author pages").

## 1. Problem

Argos only knows authors as name strings (`Book.Authors`). A book page can't link to its author, readers can't look an author up, and nothing says "you've read 4 of this author's books". Goodreads has author pages and follow; StoryGraph's most-requested missing features are "follow an author" and "new release alerts", and their staff said author pages had to come first. So: author pages are the foundation, personal reading history makes them worth visiting, and follow comes on top.

## 2. What Open Library gives us (checked 2026-10-15)

| Need | Endpoint | Notes |
|---|---|---|
| Find an author | `/search/authors.json?q=` | `key`, `name`, `alternate_names`, `birth_date`, `top_work`, `work_count`, `top_subjects` |
| Author details | `/authors/{OL…A}.json` | `name`, `bio` (a string **or** `{type, value}`), `birth_date`, `death_date`, `photos` (numeric ids, can contain `-1`), `links` (`title`, `url`), `alternate_names`, `remote_ids` (wikidata, goodreads, storygraph, imdb…). Any field can be missing. |
| Their works | `/search.json?q=author_key:OL…A&sort=editions&fields=key,title,first_publish_year,cover_i,edition_count,ratings_average,ratings_count,language&limit=&offset=` | One record per work, `numFound` is the total, supports `sort`. **Use this, not `/authors/{id}/works.json`**: that endpoint returns newest-created first with many duplicate/coverless records and most entries have no `covers` or `subjects` (J. K. Rowling's first entries were three identical coverless Spanish editions). |
| Photo | `https://covers.openlibrary.org/a/olid/{OL…A}-M.jpg` (or by photo id) | Placeholder when there is none. Always built by us from a validated id. |

There is no batch fetch of full author data and no documented rate limit, only the expectation of a descriptive `User-Agent` and reasonable rates (SPEC.md §8). `OpenLibraryClient` already requests `/authors/{id}.json` to turn a work's author keys into names (`ResolveAuthorNamesAsync`) and already uses `/search.json` with `cover_i`, `ratings_*` fields.

## 3. Decisions

1. **An `Authors` table plus author ids on each book**, not live-only. Follow, "your history with this author" and reader stats all join a user's logs to an author id, which needs a stored id. `Books.Authors` (string array) stays for display and search. *Changed while building:* the ids are a `Books.AuthorKeys` text array in the same order as `Books.Authors`, not a `BookAuthors` join table, so every query that already loads a book gets its author ids with no extra join (dozens of queries build book cards). A GIN index makes "books by this author" an index lookup.
2. **Works are not stored.** They are fetched from Open Library search on demand and cached in memory for about an hour. Our own `Books` rows are the only works Argos persists.
3. **Works grid:** Open Library search sorted by popularity (`edition_count`), **only works with a cover by default**, with a "Show all works" toggle. Filtering happens on Open Library's side (`cover_i:*` in the query), so paging stays correct.
4. **Bios show as written**, labelled "From Open Library" with a link to the Open Library page. No translation, no hiding in other UI languages.
5. **Follow and new-release alerts are Phase 3**, but the `Authors` row and ids from Phase 1 are designed to carry it.
6. **Verified authors and Q&A stay in `FUTURE-IDEAS.md`**: they need moderation first (harassment risk).

## 4. Design

### 4.1 Data model (Phase 1)

*As built (migration `AddAuthors`):*

- `Authors(id, open_library_id UNIQUE varchar(20), name varchar(300), bio varchar(10000) NULL, birth_date varchar(100) NULL, death_date varchar(100) NULL, photo_id int NULL, alternate_names text[], links_json jsonb, cached_at)`. Dates are kept as the free text Open Library gives ("31 July 1965", "c. 1850"); the API sends only the year. Every field is checked and cut to its column length in `OpenLibraryAuthor.From`.
- `Books.AuthorKeys text[]` (default `{}`, GIN index): the Open Library author id of each name in `Books.Authors`, same order. Names and ids are always written together; `BookDto.AuthorIds` is sent only when the two lists are the same length.
- A row is stored the first time an author's page is opened, never as a mirror of Open Library. "No such author" is remembered in memory for a day, not as a row. Rough size: 1–3 KB a row; 50,000 authors is about 100 MB.
- A `pg_trgm` GIN index on `Authors.name` for searching our own table when Open Library is down (same pattern as the title index).
- **Merged authors:** Open Library answers a merged author with `{"type": "/type/redirect", "location": "/authors/OL…A"}`. The client follows up to two hops and keeps the current id; books get the current id too (before this, a book silently lost a merged author's name). An old id in a link is remembered in memory for a day.
- *Phase 3, as built (migration `AddAuthorFollows`):* `AuthorFollows(user_id, author_id, created_at)`, PK (user_id, author_id), both foreign keys cascade; `AuthorReleases(id, author_id, book_id, detected_at)`, unique (author_id, book_id), both cascade; on `Authors`: `releases_checked_at`, `recent_work_keys[]`, `pending_work_keys[]`. A deactivated reader's follows are hidden by the usual query filter.
- **Backfill:** books cached before this get their ids from the existing refresh job (§6).

### 4.2 API

All ids are validated against `^OL[0-9]{1,12}A\z` before any outbound call (also blocks path/SSRF tricks).

| Endpoint | Auth | Rate limit | What |
|---|---|---|---|
| `GET /api/authors/search?query=` | public | `search` (30/min) | Open Library author search (20 results), falling back to our `Authors` table when Open Library is unreachable. Built in Phase 1, used by the page in Phase 2. Same query checks as book search (not empty, at most 200 characters); the site will start searching from 2 characters. |
| `GET /api/authors/{id}` | public | `search` | Author details from our row; fetched and stored when missing or stale (cache-aside, same lost-insert-race handling as books). A stale row is shown while Open Library is down; nothing stored and Open Library down → 503 `authors.unavailable`. Unknown id → 404, remembered for a day. *Changed:* `search`, not `public`, because a cache miss calls Open Library (same reason as `GET /api/books/{id}`). |
| `GET /api/authors/{id}/works?sort=&all=&page=` | public | `search` | The works grid (§4.4): 24 a page, at most 40 pages, `sort` one of `Popular` (default), `Newest`, `Oldest`, `HighestRated`, `all=true` includes coverless works. In-memory cache 1 hour. `unavailable: true` when Open Library is down. |
| `GET /api/authors/{id}/stats` | public | `public` | Anonymous aggregate (Phase 2, §5.2): `readers` (distinct people with a Read log whose reading is public on a public account), `ratingCount` / `averageRating` (public ratings only: the review audience, never wider than the reading's), `mostLoggedBook` and its reader count. Viewed as a signed-out visitor whoever asks, so it never differs per viewer and never reflects follows or blocks. No stored row needed: an id with no readers gives zeros. |
| `GET /api/authors/{id}/me` | signed in | none extra | The reader's own history with this author (Phase 2): `booksRead`, `averageRating`, and each book of theirs by this author with its best status (`Read` > `CurrentlyReading` > `DidNotFinish` > `WantToRead`). Their own logs, private ones included. `Cache-Control: no-store`. |
| `GET /api/authors/{id}/friends` | signed in | none extra | People the viewer follows who have a Read log of one of the author's books that the viewer may see (reading visibility, private accounts, blocks either way, deactivated all applied in SQL): `total` and the 12 who finished one most recently, with how many of the author's books each read. `Cache-Control: no-store`. |
| `PUT/DELETE /api/authors/{id}/follow` | signed in | `search` for PUT | Phase 3. PUT stores the author first (it may call Open Library), at most 500 follows a reader (`authors.tooManyFollows`); following again is fine. Both answer `{openLibraryId, isFollowing}`. `GET /{id}/me` also says `isFollowing`. |
| `GET /api/users/{username}/followed-authors?page=` | public | none extra | Phase 3. *Changed from `/api/me/followed-authors`:* one endpoint for your own list and anyone's. 48 a page, most recently followed first. Same gate as favourites and the journal: 404 across a block, for a deactivated account, or for a private account the viewer isn't an approved follower of. `no-store` for a signed-in viewer. |

Stale rule: `cached_at < now - 30 days` (`CacheRefresh:StalenessThresholdDays`) is refetched on the next view. *Changed:* no background refresh for authors: only viewed authors matter, and a view refreshes them. Error codes `authors.badOpenLibraryId`, `authors.badSort`, `authors.unavailable` (not found uses the generic `http.404`).

### 4.3 Author page (Phase 1)

Photo (round, like reader avatars; initials on the accent colour if none or if it fails to load), name, years ("1892–1973", "Born 1965", "Died 1616"), "Also known as…" (at most 5, spellings that only differ in punctuation or case dropped), bio (folded with a fade after ~600 characters, "Read more" / "Show less" with `aria-expanded`; plain text, Markdown leftovers like "([Source][1])" removed by `AuthorText.CleanBio`), links (`http(s)` only, `rel="noopener noreferrer"`), "Details from Open Library" linking to the Open Library page, then the Works grid. "No biography yet." when there is none. A merged author's old id in the address is replaced with the current one (sort and filter kept).

### 4.4 Works grid

Cards reuse the existing book card and grid. Sort: Most popular (default, most editions), Newest first, Oldest first, Highest rated. Checkbox "Include books without a cover". Both kept in the address (`?sort=Newest&all=1`). "{n} books" count, then "Show more results" paging as on the search page; a book repeated across pages shows once. Every card opens `/books/{workId}`, which caches the book on first visit, like search results. When none has a cover: "None of this author's books has a cover yet." with a "Show books without a cover" button. Open Library down: an error line, the header still shows.

### 4.5 Security and privacy

- Author data is public. Bios and links are **untrusted text** from a crowd-edited source: rendered as text, URLs scheme-checked, photo URLs built by us from a numeric id.
- `/me` and follows follow the same visibility rules as shelves (`ROADMAP.md` Stage 8 private accounts, blocks).
- **Aggregates must not leak private readers:** the anonymous stats count only readers whose shelves are visible to the public (public accounts, not deactivated), and "friends who read this" counts only people the viewer follows and may see. This is the one place a privacy bug is easy, so it gets tests and an `argos-security` review.
- Erasure and export (`AccountErasureRepository`, `AccountExportRepository`) must include `AuthorFollows` in Phase 3. The `Authors` table holds no user data.
- Open Library is called only through `OpenLibraryClient`, never from controllers.

### 4.6 Hosting and cost

No new service, queue or search cluster. The tables are tiny. Extra Open Library load is a few calls per newly seen author, then cache hits; the risky moment is the backfill, hence the throttle. Photos are hotlinked from Open Library's cover CDN (no storage cost). If Open Library is down, the page renders from the stored row and only the works grid shows "unavailable".

## 5. Phases

### Phase 1 — Foundation: the author page

Authors table, links from books, endpoints, author page, linked author names on the book page.

### Phase 2 — Find and personalise

- **5.1 Authors tab in Search:** a Books / Authors toggle on the search page (`/search?type=authors`), same box and URL state. Result rows: photo, name, years, "top work", work count. The top-bar suggestions stay books-only.
- **5.2 Winged Words stats on the author page:** readers, average rating, most-logged book (counted over visible readers only).
- **5.3 Your history:** "You've read 4 of these 12" with a progress bar, your average rating for them, and read books marked in the works grid (Letterboxd's filmography idea). Compared against works Argos knows (books you have logged), so the copy says "of the books listed here".
- **5.4 Friends who read this author:** avatars of people you follow, linking to their profiles.
- **5.5 Author names link everywhere:** book page (Phase 1), stats "top authors", search results, club and list item rows.

### Phase 3 — Follow

Follow button, "Authors you follow" on your profile and a followed-authors page, a throttled new-release check (only authors with at least one follower; compares `work_count` / newest work key), notifications through the existing notifications table, and a Feed item. Needs follows in export and erasure.

*As built (2026-10-16):*

- **Follow button** next to the author's name (signed in only). **Profile:** "Authors you follow" / "Authors they follow" row (8 photos, "See all (n)"), hidden on someone else's profile when empty; **`/u/:username/authors`** lists them all with Show more.
- **New-release check** (`AuthorReleaseCheckService`, every 6 h, `AuthorReleases:*` settings, off in test hosts): authors with at least one active follower, each at most once a day, longest-waiting first, 200 a run, paced like imports, stops after 3 failures in a row. One Open Library search per author (24 newest works). A work is **new** when its id is a valid work id, it is dated last year, this year or next year, it wasn't among the newest works last time, and its title isn't one already seen or announced. It is **announced only when the next check still finds it** (a made-up work added on Open Library is usually removed within a day), so an alert comes about a day after Open Library lists the book. More than 3 new works at once is a bulk edit, recorded without alerts. The first check of an author only records what is there.
- **Announcing:** the book is stored like a first page visit, an `AuthorRelease` row is written with its own time, and one bulk insert tells every follower who followed before then, isn't deactivated and hasn't switched off the new **"New books"** notification group (on by default). The bell says "New from {author}: {title}" and opens the book. The **Feed** (All only) shows a card for each release of an author you follow found after you followed them; unfollowing removes them.
- **Export** adds `followed-authors.csv` (author, Open Library id, since); **erasure** is the account row's cascade.
- **Merged authors:** follows move to the current author when the stored name resembles theirs (same check as books); otherwise they are dropped with the old row and a warning logged.

### Phase 4 — Extras

Favourite authors on the profile (pick up to 4), and quotes from the existing annotations grouped by author. Verified authors / Q&A are not part of this spec.

*As built (2026-10-16):*

- **What "quotes" are here:** a `Writing` of kind `Quote` whose source is a catalog book (`SourceBookId`). Writings have no visibility setting of their own: public except from a private account's non-followers, and never across a block (`VisibleTo` plus the blocked-user filter). Review text and highlight comments are not quotes and are not used. A quote typed with a free-text source has no author id and never appears.
- **Quotes on the author page:** no new endpoint. `GET /api/writings?authorId=OL…A` (id validated like the other author endpoints, 400 `authors.badOpenLibraryId`) keeps only quotes from a book whose `AuthorKeys` holds the id, after the usual privacy filters, so it can only narrow what the Writings tab already shows. A "Quotes" section (5 at a time, "Show more quotes", newest first, the usual writing card) sits between the readers box and the works grid; no quotes, no section.
- **Favourite authors:** `FavouriteAuthors(user_id, author_id, created_at)` (migration `AddFavouriteAuthors`), at most 4 (`authors.tooManyFavourites`), shown in the order added. Picked with an **"Add to favourites"** button next to Follow on the author page (signed in only; it does not need a follow). `PUT/DELETE /api/authors/{id}/favourite` (PUT uses the `search` limit: it may store the author first); `GET /{id}/me` also says `isFavourite`; `GET /api/users/{username}/favourite-authors` uses the profile gate of the followed-authors list. The profile shows "Your favourite authors" (empty hint on your own) / "Favourite authors" above "Authors you follow", hidden on someone else's profile when empty.
- **Export** adds `favourite-authors.csv`; **erasure** is the account row's cascade; a merged author's favourites move with the follows under the same name check.

## 6. Backfill and refresh rules

*As built:* no new job. `OpenLibraryCacheRefreshService` (daily) now also picks books that have author names but no `AuthorKeys`, and refreshing a book fills them in.

- Paced through the existing `OpenLibraryPacer` (`Imports:OpenLibraryIntervalMs`, 1 s), so its requests are spaced like imports', across the whole API.
- At most `CacheRefresh:MaxBooksPerRun` (500) books a run, oldest `cached_at` first, each saved as soon as it's refreshed: a restart or a sleeping Render instance loses nothing and the next run continues.
- The per-item try/catch stays: one bad record must not stop the host.
- `CacheRefresh:Enabled` (default true) is off in the test hosts, which used to send their test books to the real Open Library.
- Seen on the dev database 2026-10-15: all 63 books lacking ids were linked during one browser-check session (a few minutes), with no errors and no book whose id and name counts differ.

## 7. Tasks

> ⚠️ **Phase 1's migration and backfill are the risky part: switch to high effort for those two tasks** (and for the Phase 2 privacy endpoints). Run `reviewer` at the end of each phase and `argos-security` after Phase 2 and Phase 3 (privacy rules, external API input).

### Phase 1 — Backend
- [x] `Author` entity and `Books.AuthorKeys` (instead of a `BookAuthor` join table, §3.1), `ArgosDbContext` mapping, indexes, migration `AddAuthors` **(high effort)**
- [x] `OpenLibraryClient`: keep author ids when caching/refreshing a work (following merged-author redirects); `GetAuthorAsync`, `SearchAuthorsAsync`, `GetAuthorWorksAsync` (search-based, `cover_i` filter, sort); `OpenLibraryAuthor` checks every field (bio string-or-object, photos, http(s) links, other names, control characters, lengths)
- [x] `IAuthorRepository` / `AuthorRepository`; `AuthorService` (cache-aside, stale rule, negative cache, alias cache, 2-minute cooldown after Open Library fails, lost-insert race)
- [x] `AuthorsController`: search, `{id}`, `{id}/works`, id validation, rate-limit attributes, ErrorCodes
- [x] Backfill through the existing refresh job: books without author ids count as stale, paced, capped, saved per book **(high effort)**
- [x] `BookDto.AuthorIds` alongside the existing names
- [x] Unit and integration tests: bio shapes, missing fields, invalid ids, redirects, negative cache, Open Library down, backfill selection against the real database, refused saves

### Phase 1 — Frontend
- [x] Types and API client calls (`api/authors.ts`), query keys
- [x] `/authors/:id` page: header, bio with Read more, links, attribution, Works grid with sort, "Include books without a cover", Show more, loading/empty/error states, old id → current id
- [x] Author names on the book page become links (`AuthorNames`)
- [x] `authors.*` keys in all five locales; tokens only (`web-design` skill); phone width

### Phase 1 — Verification
- [x] Backend tests (923), `npm test` (748), `npm run build`, `npm run lint`
- [x] Browser check (2026-10-15, real Open Library): Tolkien and Rowling, an author with almost no data (Elisabeth Le Guin), a merged id (OL4327048A → Emily Brontë), an unknown and a bad id, Show more, sort, cover filter, book page link; Paper, Dark and Sepia; 1280 and 375 px
- [x] `reviewer` and `argos-security` passes, findings fixed (§7.1); `SPEC.md` §7 data model updated

#### 7.1 Phase 1 review findings (2026-10-15)

Fixed:
- **Half a character** (security, Medium): cutting a name or bio could split an emoji or rare CJK character, which Postgres refuses, so an Open Library edit could break an author page, a book's first fetch and the refresh job. Cuts now back off before a surrogate pair (`AuthorText.Prefix`).
- **NUL and control characters** are stripped from every stored field (Postgres refuses a NUL).
- **The refresh job can't stop the API:** a failed run is logged and retried next interval; a book whose save is refused has its changes dropped and the run goes on; three refused saves in a row end the run.
- **A co-author unreachable during a refresh** no longer drops them from the book for a month: names and ids are only replaced from a complete answer.
- **Open Library down:** a stale author or a works list asks it at most once per 2 minutes, instead of every view waiting out the timeout.
- **Empty works pages aren't cached**, so made-up ids don't fill memory.
- **BC dates:** "1200 BC" no longer shows as born in 1200 (`OpenLibraryAuthor.Year`).
- **A failed "Show more"** now says so and keeps the button to try again.

Left, on purpose:
- Books whose authors Open Library can't resolve at all stay in the refresh set and are tried again each run. They go to the back of the queue (oldest first), so they only use what's left of the 500-book budget. Revisit if the logs show many.
- The in-memory cache has no size limit (security, Low): entries are small, expire within a day and are bounded by the per-IP rate limit. Setting `SizeLimit` would require a size on every cache entry in the app; do it if memory use shows up on Render.
- Anonymous callers can store real authors by opening their pages (security, Info): the same as `GET /api/books/{id}` storing books.
- **For Phase 2:** an author row stored under an id that Open Library later merged stays in use for up to 30 days (the old→current mapping is only in memory). Before joining logs to authors, store current ids only or merge such rows. **Done in Phase 2:** the moment `AuthorService.GetAsync` learns of a merge (Open Library answers with a redirect) it calls `IAuthorRepository.MergeAsync(old, current)`, in one transaction after the current row is stored: the old `Authors` row is deleted and the old id is replaced by the current one in every `Books.AuthorKeys` (`array_replace`, order kept, so `AuthorKeys[i]` still matches `Authors[i]`; `@>` uses the GIN index). **Still open, by design:** a merge nobody has looked at yet is only found when its page is opened with the old id or when a book is refreshed by the daily job (which follows redirects), so for up to the 30-day refresh window a book can carry an old id and its reader counts show under it, not under the current one. Closing that fully would need a call to Open Library per author.

#### 7.2 Phase 2 review findings (2026-10-15)

No blocking or privacy findings (`argos-security`: stats are computed as a signed-out visitor whoever asks; `/me` and `/friends` are `[Authorize]`, `no-store`, and apply reading visibility, private accounts, two-way blocks and deactivation).

Fixed:
- A book that already lists both the old and the current id keeps the old one on merge instead of repeating the current id (`MergeAsync`).
- A failed repair after the author is saved is logged, not a 500.
- Ratings: one per reader and book, their latest visible one (a reread rated twice counts once), so `RatingCount` and the average agree with `Readers`.
- Mistaken or vandalised merges (decided 2026-10-16 to add a safeguard): `MergeAsync` only moves a book when the name it holds for that author resembles the current author's name or one of their other names (`AuthorText.Resembles`: a shared word of 3+ letters, ignoring case and punctuation). A redirect to somebody unrelated moves nothing and logs a warning with the counts.
- Stats and friends refresh sooner: author stats are under the `logs` query key, and following or unfollowing refreshes the friends row.
- Misplaced doc comments (`StatsOverviewCalculator`, `ArgosDbContext`), controller uses its id message constant.
- Checked: `AuthorKeys.Contains` is translated to `@>` (seen in the SQL log), so the GIN index is used.

Left, on purpose:
- The merge repair is a bulk UPDATE, so a refresh job that loaded a book before it and saves after it can write the old id back; the next refresh or old-id view repairs it. Silent but self-healing.
- The name check is deliberately loose (two different people sharing a surname still pass), and a real merge where the books use a very different name (a pseudonym that Open Library doesn't list as another name) is left for the 30-day refresh, which follows redirects itself.

### Phase 2 — Backend
- [x] Authors search endpoint wired to the search page (fallback to own table) — the Phase 1 endpoint, used by the Authors tab
- [x] `GET /authors/{id}/stats` (public aggregate excluding private/deactivated readers) and `GET /authors/{id}/me` **(high effort)**
- [x] Merged-author repair (§7.1): `MergeAsync` rewrites the old row and `Books.AuthorKeys` when a merge is found, with a test
- [x] Friends-who-read query honouring blocks and private accounts (`GET /authors/{id}/friends`)
- [x] Tests for every privacy case (private account, blocked, deactivated, logged out): `AuthorReadersTests`, 5 cases

### Phase 2 — Frontend
- [x] Books/Authors toggle on search, author result rows (`/search?type=authors`, from 2 characters; not offered while picking a book for a progress update)
- [x] Stats block, "your history" progress, read marks in the grid, friends row (`AuthorReaders`, `AuthorHistory`, `BookCard readByYou`)
- [x] Links from stats "top authors" (`StatsNameCountDto.OpenLibraryId`, falls back to a name search), list item rows (`ListItemDto.BookAuthorIds`) and journal rows (`JournalEntryDto.BookAuthorIds`), through `AuthorNames`. Browser-checked 2026-10-16 (list row and journal entry, 1280 and 375 px, no sideways scroll). **Decided not to link:** cover grids (search results, home), where the whole card is one small tap target (authors are reached from the book page and the Authors tab). Compare rows have the author inside the book link; club rounds show no author at all. Both left as they are. The rows that got links already had the title as its own link, so no stretched-link layout was needed.

### Phase 2 — Verification
- [x] Tests (backend 930, `npm test` 756), build, lint
- [x] Browser check (2026-10-15, side ports, real Open Library, 5 seeded readers: public friend, followed private account, followed stranger, blocked, viewer): Tolkien page shows "6 readers", average from 7 ratings, most read book, 3 followed readers, "You've read 1 of the 200 books listed here"; a stranger who follows nobody sees no friends row; signed out makes no `/me` or `/friends` call; Authors tab lists 20 rows; 375 px has no sideways scroll
- [x] `reviewer` and `argos-security` passes, findings in §7.2

#### 7.3 Phase 3 review findings (2026-10-16)

No privacy findings (`argos-security`: the followed-authors list uses the profile gate; Feed items join only the viewer's own follows; notifications skip deactivated readers and the switched-off group; export defuses formulas; erasure cascades; all raw SQL is parameterised).

Fixed:
- Every release in a run shared the run's start time, so a reader's Feed could skip or repeat release items at a page boundary, and a reader who followed mid-run missed one: each release now gets its own time.
- An author whose check kept throwing stayed first in the queue and used up the run's failures: they now go to the back, with their unsaved changes dropped.
- A made-up "new book" added on Open Library would have been announced to every follower: a work is now announced only when two checks in a row find it.
- A mistaken merge into an unrelated author would have moved followers to them: follows now move only when the names resemble.
- Work ids from Open Library are checked before they go into a request; the list is `no-store` for every signed-in viewer.

Left, on purpose:
- Two follows at the same moment can pass the 500 cap by one or two (count, then insert). Harmless: the release check's load is capped per run, not per reader.
- A release stays when Open Library later removes the work (after it was seen twice). Rare; revisit if it shows up.
- The Feed merges its sources in C# by time, then id; .NET and Postgres order uuids differently, so items with the exact same time could still swap at a page boundary. It was already so for reviews and writings, and releases no longer share times.

### Phase 3 — Backend
- [x] `AuthorFollows` / `AuthorReleases` migration, follow endpoints, followed-authors list (`GET /api/users/{username}/followed-authors`)
- [x] New-release check job (followed authors only, paced, capped, seen twice before announcing), `NewRelease` notification type and group, Feed items
- [x] Add follows to account export and erasure, with tests (`AuthorFollowTests`, 11 cases: follow/unfollow, cap, privacy, export, erasure, merges, release check)

### Phase 3 — Frontend
- [x] Follow button, followed authors page and profile section, notification, Feed card and Settings switch copy in 5 locales

### Phase 3 — Verification
- [x] Tests (backend 952, `npm test` 765), build, lint
- [x] Browser check (2026-10-16, side ports, 3 seeded readers, a seeded release): follow/unfollow on Tolkien's page survives a reload; bell row and Feed card; own profile row and `/u/…/authors`; a public reader's list visible, a private one's row hidden and page "not found"; six switches in Settings; unfollowing removes the Feed card; 1280 and 375 px, Paper and Dark, no sideways scroll
- [x] `reviewer` and `argos-security`, findings in §7.3

#### 7.4 Phase 4 review findings (2026-10-16)

No privacy findings (`argos-security`: the author filter is applied after `VisibleTo` and the block filter, so it only narrows; the favourites list uses the followed-authors gate; ids are validated before use and the new SQL is parameterised).

Fixed:
- A merge deleted a reader's favourite with the old author row: favourites now move with the follows (same name check), without doubling one.
- The list never shows more than four, even if two picks race past the cap.

Left, on purpose:
- Two picks at the same moment can pass the cap of four by one; the row still shows four (the extra one comes back after a removal).
- `/api/writings?authorId=` does not translate a merged author's old id; the author page always passes the current one.
- A signed-out visitor sees a blocked reader's quote (the known bug "Blocks only apply while signed in", P3).

### Phase 4 — Backend
- [x] `FavouriteAuthors` migration, favourite endpoints, `/me.isFavourite`, `GET /api/users/{username}/favourite-authors`, export, merge
- [x] `authorId` filter on the Writings list (quotes from that author's books)
- [x] Tests (`FavouriteAuthorTests`, 7 cases: pick/remove, cap, privacy, export and erasure, merge, quotes with private/blocked/free-text/original writings)

### Phase 4 — Frontend
- [x] "Add to favourites" button, "Favourite authors" profile row, "Quotes" section on the author page, 5 locales

### Phase 4 — Verification
- [x] Tests (backend 959, `npm test` 774), build, lint
- [x] Browser check (2026-10-16, side ports, 2 seeded readers, real Open Library): a quote shows on Tolkien's page; favourite survives a reload; own and someone else's profile rows; the fifth pick says why it was refused; signed out sees quotes and no button; 1280 and 375 px, no sideways scroll
- [x] `reviewer` and `argos-security`, findings in §7.4

## 8. Things to verify while building

- Which annotation/quote data exists today and how it is made visible (Phase 4).
- ✅ `cover_i:*` works (Rowling: 282 of 421 works have a cover) and the sort keys are `editions`, `new`, `old`, `rating` (checked 2026-10-15). `sort=old` puts some misdated records first, which the cover filter mostly hides.
- ✅ `author_key` search matches co-authored works (Tolkien's list includes books with Christopher Tolkien).
- ✅ The stats page's "top authors" had only the name string; the id now comes from `Books.AuthorKeys` when every name of the book has one (Phase 2).
