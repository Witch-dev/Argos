# 06 — Service Layer & Business Logic

## Progress

**Status:** ✅ Done

**Decisions made:**
- `BookService` lives in `Argos.Api/Services/` (not a new project) — it needs both `IBookRepository` and `OpenLibraryClient`, both already reachable from `Argos.Api`'s existing references, so a fourth project wasn't justified.
- Two methods, matching `SPEC.md`'s two Books features: `SearchAsync(query)` (local-cache-only, per the deferred-search-fallback decision — see module 05's Progress notes for the full reasoning) and `GetByOpenLibraryIdAsync(id)` (thin pass-through to `OpenLibraryClient`'s existing cache-aside flow — legitimately simple, not under-engineered). **Update, 2026-09-27:** the deferred search-fallback landed — see `specs/live-book-search.md`. `SearchAsync`'s signature didn't change (still `Task<List<Book>>`); it now merges local matches with transient, unsaved `Book` objects built from a live Open Library search.
- No `IBookService` interface (unlike the repository) — no current caller needs to fake it; module 09's plan tests services by faking their repository dependency and tests controllers via real HTTP calls, not by swapping the service layer.
- Registered `AddScoped<BookService>()` — Scoped because it transitively depends on `ArgosDbContext` via the repository.
- Working session also clarified (important context, not a code change): the rating shown on a book's page is never itself fetched from Open Library — it's computed by aggregating `Logs` rows against a `Book` row, both entirely in our own database. Open Library is only ever consulted on a genuine first-ever lookup of a book nobody has cached before.

## Concepts you'll learn

- Where business logic is supposed to live in a layered architecture, and the two failure modes on either side: "fat controller" (logic stuffed into HTTP handlers) and "anemic domain, fat everything-else" (entities that are just data bags, with all behavior scattered wherever it was convenient).
- Orchestration vs. logic: a service's job is often to *coordinate* a repository and a client (like `OpenLibraryClient`) rather than contain deep logic itself — recognizing which one you're writing.
- Transaction boundaries: why "this operation touches two tables, should it be one `SaveChangesAsync()` or two" is a real design decision with real consequences (partial failure leaving inconsistent data).

## Why this matters

By this point you have a repository (module 04) and an external client (module 05). Neither of those should know about the other — a repository shouldn't call Open Library, and a client shouldn't touch the database directly (you enforced this already in module 05 by having the client depend on the repository, not the other way around). The service layer is where "search for a book" actually becomes a coherent operation: try the cache, fall back to the source, decide what counts as success. Controllers (module 07) should be thin enough that you could swap ASP.NET Core for a different framework and barely touch this layer — that's the test of whether logic ended up in the right place.

## The task

Build a `BookService` (or similarly named service) that becomes the single entry point for "get a book" and "search books":

- It depends on `IBookRepository` and `OpenLibraryClient` (or whatever abstraction you chose for it) — not on `DbContext` directly, and not on `HttpClient` directly.
- Decide explicitly what "search" means for now (title match against the cache, with Open Library as fallback for cache misses) and implement that decision.
- If an operation ever needs to touch more than one table in one logical action (this may not happen yet at the `Book` level, but think ahead to `Logs` in module 11), think through what should happen if the second write fails after the first succeeds — you don't need to solve it here, but you should be able to describe the risk.

## Done when

- [ ] `BookService` exists, is injected with its dependencies (not constructing them), and contains the actual "what does search mean" decision logic.
- [ ] Controllers (once you build them in module 07) will be able to call one or two methods on this service and do essentially nothing else.
- [ ] You can explain, using this specific service, the difference between "fat controller" and "logic in the right layer."

## Go deeper (optional)

- Read about the "anemic domain model" anti-pattern and the counter-argument for it — for a CRUD-heavy social app like this one, a thinner domain model with logic in services is often a reasonable, deliberate choice, not automatically a mistake. Know why.
