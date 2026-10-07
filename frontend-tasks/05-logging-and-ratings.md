# 05 — Logging & Ratings

**Status:** ✅ Done

## Scope

- "Log this book" flow from the book detail page (task 03): status (want to read / currently reading / read), star rating 1–5, review text, start/finish dates, reread flag. Maps to `CreateLogRequest` / `POST /api/logs`.
- Edit/delete an existing log (owner-only — backend already enforces this via `Forbid()` on mismatch, frontend should hide/disable the edit/delete controls for non-owners rather than relying on the API to reject clicks).
- Reviews-on-book-page slot from task 03: once a book has logs with review text, render them under the book detail page. (Blocked on the "list logs for a book" gap noted below — the current `GetById` is single-log lookup only.)
- Star rating component (reusable — will also show up read-only on profile/feed/list-item cards).

## Depends on

Task 02, task 03 (book detail page), task 04 (auth — this is all behind `ProtectedRoute` for write actions).

## Known backend gap

~~No "list logs for a book" endpoint~~ — **fixed as part of this task.** Added `ILogRepository.GetByBookIdAsync` / `LogRepository` implementation (filters to logs with non-empty `ReviewText`, newest first — that's what "reviews" means for this section), `LogService.GetReviewsByBookIdAsync` pass-through, and `[HttpGet] GetByBook([FromQuery] Guid bookId)` on `LogsController` (coexists fine with the existing `[HttpGet("{id}")]` — different route shapes). Done directly, not via the teaching workflow — this is a small, additive read endpoint following the exact pattern of every sibling endpoint in the same controller, not a new backend curriculum module.

## Progress

**Done.** `StarRating` (read-only or interactive 1-5 picker, reused everywhere ratings show up), `LogForm` (create and edit mode via an optional `log` prop — status/rating/review/dates/reread, dates converted between `<input type="date">` and the ISO strings the API expects), `LogReviewCard` (renders one review; shows Edit/Delete only when `log.userId === currentUser.id`, using `LogForm` inline for editing). `BookDetailPage` now has a real "Log this book" flow (toggles `LogForm`) and a real reviews section (`GET /api/logs?bookId=`, rendered via `LogReviewCard`).

Notes:
- Reviews can't show *who* wrote them yet — `LogDto` has no username, only `userId` — so `LogReviewCard` labels the current user's own review "You" and everyone else's "A reader" until task 07's `FeedItemDto`-identity fix pattern gets applied here too (worth revisiting then: same underlying gap).
- Every user can log the same book multiple times (domain model explicitly allows rereads — SPEC.md §3), so "Log this book" always creates a new log rather than checking for an existing one first; there's no "get my log for this book" lookup to check against anyway.
- **Discovered a real backend limitation while smoke-testing, not something to fix under this task**: `BookService.SearchAsync` is local-cache-only by deliberate design (`backend-tasks/06`'s documented decision — "real Open Library search-fallback is deferred"). On a fresh database, search returns `[]` for *everything* until a book has been individually looked up by its Open Library work ID at least once (which is what actually populates the cache, via `GetByOpenLibraryIdAsync`). Confirmed via curl: searching "hobbit" against an empty cache → `[]`; fetching `/api/books/OL45804W` directly → caches it; searching "fox" afterward → finds it. This means the search UI has nothing to show in a fresh dev environment, through no fault of the frontend — flagging this clearly rather than silently working around it, since fixing it (adding an Open Library fallback to `SearchAsync`) is a real product/backend decision, not a plumbing gap like the ones this folder's been patching. Recommend deciding explicitly: live with cache-only search for now, add the fallback, or seed a small set of known books for demo purposes.
- Verified live end-to-end via curl: seeded a book (`GET /api/books/OL45804W`), confirmed cache-based search then found it, created a log with a rating and review, confirmed `GET /api/logs?bookId=` returns it with matching field casing.
- `npm run build` + `npm run lint` clean. Not yet visually confirmed in an actual browser (no browser tool this session, same caveat as tasks 03-04).
