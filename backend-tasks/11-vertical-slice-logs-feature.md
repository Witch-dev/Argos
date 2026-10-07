# 11 — Full Vertical Slice: Logs (Shelving, Rating, Reviews)

## Progress

**Status:** ✅ Done

**Decisions made:**
- `Log` entity (Domain): `Id`, `UserId` (`Guid`, no navigation property), `BookId`/`Book` (real navigation property — `Book` is Domain too, no purity issue), `Status` (`LogStatus` enum: `WantToRead`/`CurrentlyReading`/`Read`), `Rating` (`int?`), `ReviewText` (`string?`), `StartedAt`/`FinishedAt` (`DateTime?`), `IsReread`, `CreatedAt`.
- **Domain purity payoff, concrete**: `Log.UserId` has no navigation property to `ApplicationUser` (which lives in Infrastructure) — the real FK constraint to `AspNetUsers` is configured entirely via Fluent API (`HasOne<ApplicationUser>().WithMany().HasForeignKey(l => l.UserId)`) in `ArgosDbContext`, invisible to `Log` itself.
- **Cascade-delete decision, reconsidered mid-build**: `UserId` FK cascades on delete (deleting an account deletes their logs). `BookId` FK was initially cascade *by convention* (EF Core's default for a required navigation property) — caught this by reading the generated migration, and reconsidered: `Book` is a replaceable external-data cache, but `Log`s are irreplaceable user-generated reviews/ratings. Deleting a popular book should never silently wipe out its reviews. Changed to `DeleteBehavior.Restrict` for the `Book` FK specifically (removed the unapplied migration and regenerated cleanly, since nothing had used it yet).
- `IBookRepository` gained `GetByIdAsync(Guid id)` (by internal ID, not Open Library ID) — a genuine new need, to verify a referenced book exists before creating a `Log`.
- `ILogRepository`: `GetByIdAsync`, `AddAsync`, `DeleteAsync`, and a plain `SaveChangesAsync()` instead of an `UpdateAsync(Log)` — because updates go through change tracking (module 02): `LogService` fetches the tracked `Log`, mutates it directly, then just needs to flush via `SaveChangesAsync()`, no explicit "update" call needed.
- **Reading a `Log` is public, no ownership check** — reviews/ratings are meant to be visible to everyone (the whole point of a social reading app); only *writing* (update/delete) is ownership-gated.
- **`UserId` never comes from the request body** — always derived from JWT claims (`ClaimsPrincipalExtensions.GetUserId()`, a new shared extension method also retrofitted into `AuthController.Me`), so a client can never create a log "as" someone else.
- `LogOperationResult` (Success/NotFound/Forbidden/ValidationFailed via private-setter + static factories) is what `LogService` returns instead of throwing exceptions for expected outcomes (bad rating, ownership mismatch) — `LogsController` maps each to the right HTTP status (`201`/`200`/`404`/`403`/`400`).
- Validation lives in the service (`ValidateRatingAndDates`): rating must be 1–5, `FinishedAt` can't be before `StartedAt` — plus the book-exists check, all returning `ValidationFailed` with a clear message rather than a raw FK-constraint `500`.
- Proactively set `DefaultForbidScheme` (alongside the already-set `DefaultAuthenticateScheme`/`DefaultChallengeScheme`) before ever calling `Forbid()` — learned from module 10's cookie-scheme bug not to assume a new AuthN/AuthZ code path behaves correctly without checking.
- Added a global `JsonStringEnumConverter` (`AddControllers().AddJsonOptions(...)`) so `Status` serializes as `"Read"` etc., not a raw integer — friendlier for Swagger/Bruno/a future frontend.
- Structured logging added to `LogService` (module 08 habit, reapplied): warnings on rejected creates, ownership violations on update/delete, and validation failures.
- **Two genuine bugs found writing the integration test, not staged**: (1) `HttpClient.ReadFromJsonAsync` uses its own default `JsonSerializerOptions`, which doesn't inherit the server's `JsonStringEnumConverter` — deserializing `"status":"Read"` into the enum failed. (2) After fixing that, the test still failed — `PropertyNameCaseInsensitive` wasn't set, so the server's camelCase (`"id"`) didn't match `LogDto`'s PascalCase (`Id`), leaving it at `Guid.Empty` and causing a `404` instead of the expected `403`. Both fixed by giving the test's own `JsonSerializerOptions` the same conventions as the server's.
- **Fully verified for real**: entire CRUD flow via `curl` with two real registered users — unauthenticated create → `401`; invalid rating → `400`; nonexistent book → `400`; create → `201`; public `GetById` with no auth → `200`; update as owner → `200`; update as non-owner → `403`; delete as non-owner → `403`; delete as owner → `204`; subsequent `GetById` → `404`. Reread scenario verified directly in Postgres: two independent `Log` rows for the same user+book, different ratings/reviews, distinguished by `IsReread` — nothing overwritten.
- Unit tests added (`LogServiceTests`, using a new `FakeLogRepository`): create success, rating-out-of-range, book-not-found, update/delete ownership violations. Integration test added (`LogsControllerTests`): the ownership-violation case through the real HTTP stack. All 13 tests (was 7) pass.

## Concepts you'll learn

- Putting every prior layer together for a real, opinionated feature — this module has fewer *new* concepts and is instead about integration: does your architecture actually hold up end-to-end, under a feature with real business rules?
- Enforcing ownership authorization in practice (module 10's plan, applied for real).
- Idempotency and re-entrancy: what happens if the same "log this book as read" request is sent twice? What should happen on a reread (SPEC.md's `is_reread` flag)?
- Validation strategy for a richer input shape than module 07's simple search — deciding what's invalid (a rating of 0, a finish date before a start date) and where that check belongs (DTO-level vs. service-level).

## Why this matters

This is the first feature in the app with real business rules attached to it, not just "fetch and return." It's also the first place ownership authorization is load-bearing: a `Log` belongs to exactly one user, and every write endpoint needs to prove the caller *is* that user, not just *a* user. If your earlier layering (module 06's services, module 07's thin controllers) was done well, this feature should mostly be "compose the pieces you already built" — if it isn't, that's useful information about where the architecture needs to flex.

## The task

Implement the `Logs` feature per SPEC.md §4/§7:

- Model the `Log` entity (module 02/03 style: entity, migration) with status (want/reading/read), rating, review text, dates, and the reread flag.
- Build the repository, service, and controller layers (modules 04/06/07 style) for creating, updating, and reading a user's logs.
- Apply the ownership check from module 10: a user can create their own logs freely, but can only update/delete logs they own — write the test case for "user A tries to edit user B's log" yourself and confirm it's rejected, don't just assume the check works.
- Decide and implement validation rules: what makes a rating invalid, what makes a date range invalid, and where that validation lives (this is a good place to compare your answer against module 07's DTO-validation discussion).
- Apply the habits from modules 08–09 again: structured logging for failed/rejected writes, and both a unit test (service logic) and an integration test (the ownership-violation case above) for this feature specifically — not just for Books.

## Done when

- [ ] `Logs` CRUD works end-to-end through all layers, authenticated.
- [ ] You've manually verified (not just assumed) that one user cannot modify another user's log.
- [ ] Rereads are modeled and you can explain the data-model decision you made for them (new `Log` row vs. mutating an existing one, and why).
- [ ] You can walk through this feature layer-by-layer (controller → service → repository → database) and explain what each layer is responsible for, using this specific feature as the example.
- [ ] The ownership-violation case has its own test, and a rejected write produces a structured log entry.

## Go deeper (optional)

- Think about what "idempotent create" would mean here (e.g. using a client-supplied idempotency key) — not required for MVP, but worth knowing why APIs that accept money or important writes often need it.
