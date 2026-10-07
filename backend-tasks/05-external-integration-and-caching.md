# 05 — External Integration & Caching (OpenLibraryClient)

## Progress

**Status:** ✅ Done

**Decisions made:**
- Scope for this pass: `Title`, `Description`, `FirstPublishYear`, `Subjects`, `CoverUrl` mapped fully. `Authors`/`Isbns` deliberately left empty for now — Open Library's Works API only gives author *references*, not names, which would need a separate API call per author; not worth the complexity yet to prove the cache-aside pattern. **Update, 2026-09-27:** `Authors` got fixed — see the `CHANGELOG.md` entry "Author names and a broken cover-id fallback fixed" (`OpenLibraryClient.ResolveAuthorNamesAsync`, one follow-up call per author reference, applied in both `GetBookAsync` and `RefreshBookAsync`). `Isbns` is still unaddressed.
- Raw Open Library response shape (`OpenLibraryWorkResponse`, `Argos.Infrastructure/ExternalApis/OpenLibrary/`) is `internal` — invisible outside `Argos.Infrastructure` — so nothing outside this one integration can ever depend on Open Library's raw shape. `Description` is typed as `JsonElement` (not `string`) because Open Library's actual field is inconsistent (sometimes plain text, sometimes a nested object) — resolved via a `ValueKind` switch in the mapping step, not a custom `JsonConverter`, to keep it simple.
- `OpenLibraryClient` (same folder) depends on `IBookRepository` directly and owns the full cache-aside flow for a single book lookup (`GetBookAsync`): check cache → return on hit; on miss, call Open Library, map, save via `AddAsync`, return. `BookService` (module 06) will own the separate *search* flow (cache search + Open Library fallback as a policy decision) — division agreed to avoid the two modules duplicating the same logic. **Update, 2026-09-27:** this search fallback was built — see `specs/live-book-search.md`. `OpenLibraryClient` gained a second, separate method (`SearchAsync`) for it; `GetBookAsync`'s single-lookup cache-aside flow described above is unchanged.
- Failure handling: `HttpRequestException`, `TaskCanceledException` (timeout), and `JsonException` (bad response shape) are all caught and treated the same way — return `null` rather than crash. 10-second timeout set via `HttpClient.Timeout`.
- Registered via `AddHttpClient<OpenLibraryClient>` (the typed-client pattern) — one call handles both `IHttpClientFactory`'s connection-reuse machinery and DI registration. `BaseAddress` = `https://openlibrary.org`, descriptive `User-Agent` set per SPEC.md §8.
- A **temporary** test endpoint (`GET /test/openlibrary/{id}`) was added to `Program.cs` to exercise this end-to-end before module 07's real controller existed. Superseded by `BooksController` (module 07) and removed once that landed.

**What's verified, end to end, against the real API:**
- ✅ Cache-check-first logic (via EF Core's logged SQL — correctly queried `Books`, found nothing, proceeded to call Open Library).
- ✅ Graceful-degradation path, confirmed for real during an actual Open Library outage (connection actively refused, verified via an independent network path too, not just locally) — timeout caught, `null` returned cleanly, no crash.
- ✅ The success path, once Open Library came back up: real response received for `OL45804W` (*Fantastic Mr Fox*), `Description` correctly extracted from Open Library's plain-string shape, `CoverUrl`/`Subjects`/`Title` all mapped correctly, row persisted via `AddAsync` (confirmed directly in Postgres).
- ✅ Cache hit on a second lookup confirmed by identical `Id` returned both times — not a duplicate row.
- ✅ `BookService.SearchAsync` (module 06) confirmed finding the now-cached book by a partial title match ("fox"), entirely from local cache.

## Concepts you'll learn

- The Adapter pattern / anti-corruption layer: isolating your domain model from a third-party API's data shape, so Open Library's quirks don't leak into `Book`.
- `IHttpClientFactory` and *why* it exists — the specific socket-exhaustion problem that comes from `new HttpClient()` per request, which it solves.
- Resilience basics for external calls: timeouts, and the idea of retries/circuit breaking (even if you implement a minimal version now) — what happens to your app when Open Library is slow or down.
- The cache-aside pattern: check the cache, fall back to the source on a miss, populate the cache, and why this is a different (and simpler) problem than write-through or write-behind caching.

## Why this matters

SPEC.md §8 is explicit that the app must never depend on Open Library being up for a normal read, and must degrade gracefully on missing data. That's not a nice-to-have — it's the difference between "search is occasionally slow" and "search is completely broken because a third party is having a bad day." The Adapter pattern here matters for a subtler reason too: Open Library's JSON shape is *not* your `Book` entity, and if you let controllers or services deserialize Open Library responses directly into your domain type, any change on Open Library's end becomes a change to your database schema. A dedicated client that translates their shape into yours is what stops that coupling.

## The task

Build `OpenLibraryClient` per SPEC.md §5/§8:

- Use `IHttpClientFactory` to create a typed client, with a descriptive `User-Agent` set as SPEC.md §8 requires.
- Set a sane timeout, and decide (and be able to justify) what happens on failure — does the caller get an exception, a null/empty result, or something else? Tie this back to the "degrade gracefully" requirement.
- Implement the cache-aside flow against the `Books` table from module 02/04: check the local cache first (using `IBookRepository`), and only call Open Library on a genuine miss or stale (`cached_at`) entry, normalizing the response into your `Book` entity shape before persisting it.
- Make sure a malformed or partial Open Library response (missing cover, missing description) doesn't throw — it should produce a `Book` with those fields legitimately null, per SPEC.md §8.

## Done when

- [ ] `OpenLibraryClient` is registered via `IHttpClientFactory`, not `new HttpClient()`.
- [ ] You can explain the socket-exhaustion problem `IHttpClientFactory` solves, in your own words.
- [ ] The cache-aside flow is in place and you can demonstrate (e.g. by temporarily breaking your internet, or logging) that a cache hit never calls Open Library.
- [ ] A book with missing fields from Open Library doesn't crash the request — you've tested this deliberately, not just hoped for it.

## Go deeper (optional)

- Look at the Polly library for retry/circuit-breaker policies — even if you hand-roll a minimal version now, it's worth knowing what the "real" tool for this looks like.
- Read about the difference between cache-aside, read-through, and write-through caching, and why cache-aside is the natural fit when the source of truth (Open Library) is read-only from your app's perspective.
