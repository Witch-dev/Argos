# 04 — Repository Pattern & Data Access

## Progress

**Status:** ✅ Done

**Decisions made:**
- Discussed both sides of the repository-pattern debate explicitly before building anything: `DbContext`/`DbSet` is already reasonably repository-like, so this layer is a deliberate choice (matching `SPEC.md`'s layering), not an assumed necessity.
- `IBookRepository` (`Argos.Infrastructure/Repositories/`) has exactly three methods, each tied to a specific near-future caller: `GetByOpenLibraryIdAsync` (module 05's cache-check), `SearchByTitleAsync` (modules 06–07's search), `AddAsync` (module 05's cache-populate). No speculative CRUD.
- `AddAsync` does both the tracking (`_context.Books.Add`) and the actual save (`SaveChangesAsync`) in one call — kept simple rather than splitting staging from saving, since nothing in the app needs to batch multiple changes across repositories yet.
- `SearchByTitleAsync` does a case-insensitive `Contains` match (`.ToLower()` on both sides) rather than exact-match — chose plain, broadly-portable LINQ over Npgsql-specific `EF.Functions.ILike` for simplicity.
- Interface and implementation both live in `Argos.Infrastructure` (not split across Domain/Infrastructure) — reasoned that the stricter Clean-Architecture alternative (interface in Domain) exists specifically to let a separate Application/Service layer avoid depending on Infrastructure, but since this project's services will live in `Argos.Api` (which already references Infrastructure regardless), that benefit doesn't actually apply here.
- `BookRepository` registered as Scoped (`AddScoped<IBookRepository, BookRepository>`) — deliberately matching `ArgosDbContext`'s Scoped lifetime to avoid a captive-dependency bug (a longer-lived registration holding onto a shorter-lived one).

## Concepts you'll learn

- What the Repository pattern actually buys you on top of `DbContext`/`DbSet` — and the honest counterargument that EF Core's `DbSet` *is already* a repository/unit-of-work, so a hand-rolled repository layer can be redundant ceremony.
- Interface-based data access (`IBookRepository`) and how it enables swapping or faking the data layer without touching callers.
- Where query logic should live — and the smell of a repository whose interface has grown one bespoke method per screen (`GetBooksForHomePageAsync`, `GetBooksForSearchPageAsync`, ...) instead of a small set of genuinely reusable operations.

## Why this matters

SPEC.md commits to a layered `Controllers → Services → Repositories` architecture, so this project deliberately introduces a repository layer — but it's important you understand *why* someone might choose that instead of letting services use `DbContext` directly, because the "right" answer differs by project size. The case for it here: it gives services a narrow, intention-revealing surface (`GetByIdAsync`, `SearchAsync`) instead of the full power of EF Core's LINQ provider, and it's the seam module 09's unit tests will fake against. The case against it in general: for a small app, it can just be an extra file that forwards calls to `DbContext` with no real behavior of its own. Knowing both sides is the actual skill — not "always use repositories."

## The task

Build the data-access layer for `Books`:

- Define an `IBookRepository` interface with the operations the app actually needs right now (not a speculative full CRUD set) — at minimum, something like "find by Open Library id" and "search by title," driven by what module 05/06 will actually call.
- Implement it in `Argos.Infrastructure` against the `DbContext` from module 02.
- Register it in DI with the lifetime you decided was correct in module 01, and justify that choice again in this concrete case.
- Resist adding a method "because a repository probably needs it" — every method should trace back to an actual caller you're about to build in module 05 or 06.

## Done when

- [ ] `IBookRepository` exists with only the operations currently needed, each one traceable to a real caller.
- [ ] The implementation is registered in DI and injected (not `new`'d) wherever it's used.
- [ ] You can argue both sides — for and against — of using a repository layer here, specifically in terms of this project's size and the testability goal in module 09.

## Go deeper (optional)

- Research the "Repository over an ORM" debate directly — there's a well-known argument that `DbContext` is already Repository + Unit of Work, and wrapping it again just adds indirection. Form your own opinion for this project, since SPEC.md's choice is a default, not dogma.
- Look at the Specification pattern as an alternative to a growing pile of one-off repository methods, for when query variations multiply.
