# Feature Spec — Live Book Search Fallback

**Status:** ✅ Implemented (2026-09-27)

## 1. Problem

Book search (`GET /api/books?query=`) only searches the local `Books` cache (`BookRepository.SearchByTitleAsync` — a `Title` `Contains` match). On a fresh or lightly-used database, that cache is mostly empty, so searching for almost anything returns `[]` — not because the book doesn't exist, but because nobody has looked it up individually yet (the only thing that populates the cache today is `GET /api/books/{openLibraryId}`, one book at a time).

This was a known, deliberate gap from the original build — not an oversight:
- `backend-tasks/05`'s Progress notes: *"`BookService` (module 06) will own the separate search flow (cache search + Open Library fallback as a policy decision)"*.
- `backend-tasks/06`'s Progress notes: *"`SearchAsync(query)` (local-cache-only, per the deferred-search-fallback decision...)"*.

It surfaced concretely on 2026-09-27 when searching "solaris" against the seeded dev database returned "No books found" even though Solaris is a real, findable book.

## 2. What this feature is (and isn't)

**Is:** search finds *any* book Open Library knows about, not just ones already viewed before. The user asks for exactly this: *"I want to be able to look for any book, and get the information about the book, with the possibility to add a review, even if it doesn't have one already."*

**Isn't:** the book-detail-page description/cover/reviews-empty-state UI. That part was already built in `frontend-tasks/03` (search & detail pages) and `frontend-tasks/05` (logging & reviews) — `BookDetailPage` already shows cover/title/authors/description/subjects, and its Reviews section already renders "No reviews yet." with a "Log this book" button that doubles as the review form. Nothing about that needs to change; it already does exactly what's described, for any book that's actually reachable. This spec is what makes *any* book reachable in the first place.

## 3. Design

### 3.1 The core decision: don't cache from search results

Open Library's search endpoint (`/search.json`) returns lightweight metadata per result — title, author names, first publish year, a cover id. It does **not** return a description or subjects; only the per-work detail endpoint (`/works/{id}.json`, what `OpenLibraryClient.GetBookAsync` already calls) has those.

If search results were persisted into the `Books` cache directly, every book discovered via search would be permanently stuck with `Description: null` — because `GetBookAsync`'s existing cache-aside logic treats *any* cached row as a hit and never re-fetches. Fixing that would mean either an extra Open Library call per search result (defeats the point — slow, and hostile to Open Library's "reasonable request rates" ask, SPEC.md §8) or a schema change to mark rows as "thin" vs. "fully detailed" (a migration, more moving parts, for a problem the alternative avoids entirely).

**The alternative, and what's implemented:** search results that aren't already cached are returned as real API data but are never written to the database. They exist only in memory for the duration of the request. The moment the user clicks through to the book's detail page, the *existing, unchanged* `GET /api/books/{openLibraryId}` → `OpenLibraryClient.GetBookAsync` cache-aside flow runs — genuine cache miss, fetches full detail (description, subjects, cover), persists it properly, done. Caching happens exactly once, at the point the book is actually of interest, with full data, using code that already existed and needed zero changes.

Trade-off accepted: searching the same not-yet-cached query twice re-hits Open Library both times (nothing was cached the first time). Judged acceptable — simpler than the alternatives above, and the frontend's existing 300ms search debounce (`frontend-tasks/03`) already keeps this from firing on every keystroke.

### 3.2 Merge policy: always augment, don't gate on a cache-count threshold

Considered gating the live call behind "only if local cache has fewer than N results," to save external calls when the cache already has plenty. Rejected: the common real case is *some* results cached, more not — e.g. one Fox-related book cached, several others findable on Open Library the user hasn't seen. A threshold makes behavior depend on cache history in a way that's hard to predict from the UI. Simpler and more honest: always query both, merge, dedupe by `OpenLibraryId` (cached entries win — they're already richer), cap combined results at 20.

### 3.3 API contract — unchanged

`GET /api/books?query=` still returns `BookDto[]`, same shape as before. No frontend changes are required for the base feature — `SearchPage` already renders whatever comes back, and `BookCard` already links via `openLibraryId`, not the internal id. Live (not-yet-cached) results carry `id: "00000000-0000-0000-0000-000000000000"` (`Guid.Empty`) as a signal that they haven't been persisted yet — nothing on the search page uses `id` for anything but a React list key, so this is invisible to the user. `description`/`subjects`/`isbns` are empty for live results (Open Library's search endpoint doesn't provide them) until the user opens the detail page, same as any first-time lookup today.

### 3.4 Known side effect — since fixed (2026-09-27, same day, follow-up)

Open Library's search results include real author names (`author_name`); the per-work detail endpoint `OpenLibraryClient` already calls did not (`backend-tasks/05`: *"Authors... deliberately left empty for now — Open Library's Works API only gives author references, not names"*). Originally documented here as an accepted, separate piece of debt this feature wasn't going to fix. Fixed the same day after the user noticed it in practice (Solaris showing no author) — see the `CHANGELOG.md` entry "Author names and a broken cover-id fallback fixed" for the actual change (`OpenLibraryClient.ResolveAuthorNamesAsync`, one follow-up call per author reference). Left this note in place rather than deleting it — it's a record of a real trade-off that was made and then revisited, not just stale text.

## 4. Changes

No database migration. No frontend changes required for the base feature (search/detail/review flow was already built and needed nothing new).

**Backend:**
- `IOpenLibraryClient` gains `Task<List<OpenLibrarySearchResult>> SearchAsync(string query, int limit)`.
- New `OpenLibrarySearchResult` (public, in `Argos.Infrastructure.ExternalApis.OpenLibrary`) — `OpenLibraryId`, `Title`, `Authors`, `FirstPublishYear`, `CoverUrl`. Lighter than `Book`: no `Description`/`Subjects`/`Isbns`, since search doesn't provide them.
- New internal `OpenLibrarySearchResponse`/`OpenLibrarySearchDoc` — raw shape of Open Library's `/search.json` response (`key`, `title`, `author_name`, `first_publish_year`, `cover_i`), requested with `fields=` trimmed to just those (smaller payload, one more small courtesy to Open Library's rate-limit ask).
- `OpenLibraryClient.SearchAsync` implementation: same failure-handling shape as `GetBookAsync` (`HttpRequestException`/`TaskCanceledException`/`JsonException` → log a warning, return `[]` rather than fail the request — search degrades to cache-only, never a 500).
- `BookService.SearchAsync`: unchanged signature (`Task<List<Book>>`) — merges cached `Book` rows with **transient, unsaved** `Book` objects built from live results (`Id = Guid.Empty`, never passed to `_bookRepository.AddAsync`). `BooksController` needed **zero changes** — its existing `ToDto(Book)` mapping already handles both cases.

**Tests:**
- `FakeOpenLibraryClient` gains a configurable search-results list (defaults to empty, so every pre-existing test that doesn't care about search behaves exactly as before).
- `BookServiceTests.SearchAsync_ReturnsEmptyList_WhenNothingMatches` updated — under the old code this meant "cache had nothing"; now it must also configure the fake's live results as empty to still assert `[]`, otherwise it's testing something that's no longer true.
- New tests: merges cache + live results and dedupes by `OpenLibraryId`; live-only results carry `Id = Guid.Empty` and empty `Description`/`Subjects`; a failing/throwing live search still returns the cached results instead of surfacing an error.

**Docs:**
- `SPEC.md` §5 (architecture) and §8 (constraints) updated to describe search as cache-first-with-live-fallback, not local-cache-only.
- `backend-tasks/05` and `backend-tasks/06` Progress notes get a short pointer back to this file, so a future reader doesn't take their "deferred" language at face value.

## 5. Tasks

- [x] `OpenLibrarySearchResult` + `OpenLibrarySearchResponse`/`OpenLibrarySearchDoc` types.
- [x] `IOpenLibraryClient.SearchAsync` + `OpenLibraryClient.SearchAsync` implementation, including the failure-handling path.
- [x] `BookService.SearchAsync` merge/dedupe logic over cached + live results.
- [x] `FakeOpenLibraryClient` search-results support; fix the now-invalid "nothing matches" test; add merge/dedupe/graceful-degradation tests.
- [x] Full backend test suite green.
- [x] Live verification against the real Open Library API and the running dev stack (not just unit tests) — confirm "solaris" and other previously-unfindable titles now return results, and that opening one still populates full detail on first visit.
- [x] `SPEC.md` updated.
- [x] `backend-tasks/05`/`06` pointer notes added.

## 6. Explicitly out of scope

- Fixing `Authors` for the detail/cache-aside path (§3.4) — separate, pre-existing, already-documented gap.
- Any UI change to `SearchPage`/`BookCard`/`BookDetailPage` — none needed.
- Pagination beyond the 20-result cap — Open Library's search endpoint supports it, but nothing in this app's UI does yet either; add it together if/when it's actually needed.
