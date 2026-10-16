# Feature Spec — Authors: search, author pages, follow

**Status:** 📝 Specced 2026-10-15, nothing built yet. Research and decisions come from the 2026-10-15 conversation; the first sketch is in `FUTURE-IDEAS.md` ("Author pages").

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

1. **An `Author` table plus a `BookAuthors` link**, not live-only. Follow, "your history with this author" and reader stats all join a user's logs to an author id, which needs a stored row. `Books.Authors` (string array) stays for display and search.
2. **Works are not stored.** They are fetched from Open Library search on demand and cached in memory for about an hour. Our own `Books` rows are the only works Argos persists.
3. **Works grid:** Open Library search sorted by popularity (`edition_count`), **only works with a cover by default**, with a "Show all works" toggle. Filtering happens on Open Library's side (`cover_i:*` in the query), so paging stays correct.
4. **Bios show as written**, labelled "From Open Library" with a link to the Open Library page. No translation, no hiding in other UI languages.
5. **Follow and new-release alerts are Phase 3**, but the `Authors` row and ids from Phase 1 are designed to carry it.
6. **Verified authors and Q&A stay in `FUTURE-IDEAS.md`**: they need moderation first (harassment risk).

## 4. Design

### 4.1 Data model (Phase 1)

- `Authors(id, open_library_id UNIQUE, name, photo_id NULL, birth_date text NULL, death_date text NULL, bio text NULL, links jsonb, alternate_names text[], work_count int NULL, cached_at, not_found_at NULL)`. Dates are kept as the free text Open Library gives ("31 July 1965", "c. 1850"); they are not reliably parseable.
- `BookAuthors(book_id, author_id, position)`, primary key `(book_id, author_id)`, index on `author_id`.
- Later: `AuthorFollows(user_id, author_id, created_at)` (Phase 3).
- A `pg_trgm` GIN index on `Authors.name` for searching our own table when Open Library is down (same pattern as the title index).
- Rows are created only for authors of books Argos has cached or someone has opened, never as a mirror of Open Library. Rough size: 1–3 KB a row; 50,000 authors is about 100 MB.
- **Linking:** `OpenLibraryClient` already sees the author keys when it caches or refreshes a work. It now keeps the key and upserts an `Authors` stub (name only, `cached_at` null = details not fetched yet) and the `BookAuthors` row.
- **Backfill:** existing books get linked by a one-off, throttled, resumable job (see §6).

### 4.2 API

All ids are validated against `^OL\d{1,12}A$` before any outbound call (also blocks path/SSRF tricks).

| Endpoint | Auth | Rate limit | What |
|---|---|---|---|
| `GET /api/authors/search?query=` | public | `search` (30/min) | Open Library author search, fallback to our `Authors` table when Open Library is unreachable. Minimum 2 characters. |
| `GET /api/authors/{id}` | public | `public` (60/min) | Author details from our row; fetched and stored when missing or stale (cache-aside, same lost-insert-race handling as books). Unknown id → 404 and `not_found_at` set for a day (negative cache). |
| `GET /api/authors/{id}/works?sort=&showAll=&page=` | public | `search` | The works grid (§4.4). In-memory cache about 1 hour. |
| `GET /api/authors/{id}/stats` | public | `public` | Anonymous aggregate (Phase 2, §5.2). |
| `GET /api/authors/{id}/me` | signed in | none extra | The reader's own history with this author (Phase 2). Never cached or shared. |
| `PUT/DELETE /api/authors/{id}/follow`, `GET /api/me/followed-authors` | signed in | — | Phase 3. |

Stale rule: `cached_at < now - 30 days` is refetched on the next view; a separate throttled background job (reusing the shape of `OpenLibraryCacheRefreshService`) refreshes the oldest rows only. New ErrorCodes and `errors.codes` translations for "author not found" and "invalid author id".

### 4.3 Author page (Phase 1)

Photo (placeholder initials if none), name, years ("1965 –" / "1850 – 1912"), pen names ("Also writes as…"), bio (collapsed after ~6 lines with "Read more", plain text only), links (official site and others, `http(s)` only, `rel="noopener noreferrer"`), the "From Open Library" attribution, then the Works grid. Empty states for every missing field: a lesser-known author may have only a name.

### 4.4 Works grid

Cards reuse the existing book card. Sort: Most popular (default), Newest, Oldest, Highest rated. Toggle "Show all works". "Show more" paging as on the search page. A work Argos has already cached links to our book page; any other opens the book by its Open Library id like search results do.

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

### Phase 4 — Extras

Favourite authors on the profile (pick up to 4), and quotes from the existing annotations grouped by author. Verified authors / Q&A are not part of this spec.

## 6. Backfill and refresh rules

- One request at a time with a delay of about 1 second between Open Library calls, a per-run batch cap, and always oldest `cached_at` first, so a restart simply continues.
- A per-item try/catch (as in `OpenLibraryCacheRefreshService`): one bad record, which Open Library's user-edited data can produce, must not stop the host.
- Runs under the same `BackgroundService` approach, no Hangfire.

## 7. Tasks

> ⚠️ **Phase 1's migration and backfill are the risky part: switch to high effort for those two tasks** (and for the Phase 2 privacy endpoints). Run `reviewer` at the end of each phase and `argos-security` after Phase 2 and Phase 3 (privacy rules, external API input).

### Phase 1 — Backend
- [ ] `Author` and `BookAuthor` entities, `ArgosDbContext` mapping, indexes, migration **(high effort)**
- [ ] `OpenLibraryClient`: keep author keys when caching/refreshing a work, upsert `Authors` stubs and `BookAuthors`; `GetAuthorAsync`, `SearchAuthorsAsync`, `GetAuthorWorksAsync` (search-based, `cover_i` filter, sort); response classes extended (bio string-or-object, photos, links, remote ids)
- [ ] `IAuthorRepository` / `AuthorRepository`; `AuthorService` (cache-aside, stale rule, negative cache, lost-insert race)
- [ ] `AuthorsController`: search, `{id}`, `{id}/works`, id validation, rate-limit attributes, ErrorCodes
- [ ] Throttled, resumable backfill job for existing books **(high effort)**
- [ ] `BookDto` carries `authors: [{id, name}]` alongside the existing names
- [ ] Unit and integration tests: bio shapes, missing fields, invalid ids, negative cache, Open Library down, backfill resume

### Phase 1 — Frontend
- [ ] Types, API client calls, React Query hooks
- [ ] `/authors/:id` page: header, bio with Read more, links, attribution, Works grid with sort, "Show all" toggle, Show more, loading/empty/error states
- [ ] Author names on the book page become links
- [ ] `authors.*` keys in all five locales; tokens only (`web-design` skill); phone width

### Phase 1 — Verification
- [ ] Backend tests, `npm test`, `npm run build`, `npm run lint`
- [ ] Browser check: a famous author, an author with almost no data, a bad id, Open Library unreachable; 375 px
- [ ] `reviewer` pass; update `SPEC.md` §7 data model

### Phase 2 — Backend
- [ ] Authors search endpoint wired to the search page (fallback to own table)
- [ ] `GET /authors/{id}/stats` (public aggregate excluding private/deactivated readers) and `GET /authors/{id}/me` **(high effort)**
- [ ] Friends-who-read query honouring blocks and private accounts
- [ ] Tests for every privacy case (private account, blocked, deactivated, logged out)

### Phase 2 — Frontend
- [ ] Books/Authors toggle on search, author result rows
- [ ] Stats block, "your history" progress, read marks in the grid, friends row
- [ ] Links from stats "top authors", search results, clubs and lists

### Phase 2 — Verification
- [ ] Tests, build, lint; browser check with seeded readers (public, private, blocked)
- [ ] `reviewer` and `argos-security`

### Phase 3 — Backend
- [ ] `AuthorFollows` migration, follow endpoints, followed-authors list
- [ ] New-release check job (followed authors only, throttled) and notification type
- [ ] Add follows to account export and erasure, with tests

### Phase 3 — Frontend
- [ ] Follow button, followed authors page and profile section, notification and Feed item copy in 5 locales

### Phase 3 — Verification
- [ ] Tests, build, lint, browser check, `reviewer` and `argos-security`

### Phase 4
- [ ] Favourite authors (max 4) on the profile
- [ ] Quotes by author from existing annotations (check the annotation model and privacy first)

## 8. Things to verify while building

- Which annotation/quote data exists today and how it is made visible (Phase 4).
- That `cover_i:*` works in the Open Library query as expected, and the right sort keys.
- Whether `author_key` search also matches co-authored works (it should; check one anthology).
- Whether the stats page's "top authors" has an author id available or only the name string (Phase 2 links).
