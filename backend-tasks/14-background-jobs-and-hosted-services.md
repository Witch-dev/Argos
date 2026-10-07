# 14 — Background Jobs & Hosted Services

## Progress

**Status:** ✅ Done

**Decisions made:**
- **`BackgroundService`, not Hangfire** — decided deliberately, matching the project's "boring by design" theme throughout: Hangfire's real value (persistence across restarts, a dashboard, distributed coordination) doesn't apply to a solo/small-team MVP with exactly one background job. Zero extra dependencies, zero extra infrastructure.
- **A genuine gap closed first**: `OpenLibraryClient` only knew how to *create* a new cached `Book`. Added `RefreshBookAsync(Book book)` to `IOpenLibraryClient`/`OpenLibraryClient`, which updates an *existing* book's fields in place — deliberately keeping the old value for any field the fresh response doesn't provide, rather than overwriting previously-good data with nothing.
- **The captive-dependency problem, in a new context**: `OpenLibraryCacheRefreshService` (a Singleton, since `BackgroundService`s run for the app's whole lifetime) needs Scoped `IBookRepository`/`IOpenLibraryClient`. Injected `IServiceScopeFactory` instead of the services directly, opening a **fresh scope every single refresh pass** inside `ExecuteAsync`'s loop, disposed via `using` at the end of each pass — the same captive-dependency fix from module 01, applied to a background job instead of a request.
- **Designed for testability from the start**: the actual "select stale books, refresh each, save" logic lives in a `public` `RunOnceAsync(IBookRepository, IOpenLibraryClient, CancellationToken)` method, separate from `ExecuteAsync`'s infinite loop — directly unit-testable with fakes and no real DI container, even though `IServiceScopeFactory` (unused by this method) can just be passed as `null!` in a test.
- `IBookRepository` gained `GetStaleBooksAsync(DateTime olderThan)` and a plain `SaveChangesAsync()` (matching the `ILogRepository`/`IBookListRepository` pattern) — the job batches all refreshes into **one** save at the end.
- **Idempotency, kept deliberately simple**: since the job never creates rows (only updates existing ones) and saves once at the end of a batch, a crash mid-run persists nothing from that run — the next run just reprocesses the whole stale batch from scratch. No partial-progress bookkeeping, no risk of a half-applied corrupted state; a legitimate trade-off for a low-stakes, non-time-critical job.
- `CacheRefreshOptions` (`RefreshIntervalHours` = 24, `StalenessThresholdDays` = 30) via the same Options pattern as `DatabaseOptions`/`JwtOptions`, in `appsettings.json` (not `Development`-specific — not a secret, applies everywhere). `TokenService`-style reasoning confirmed again: `IOptions<T>` is safe to inject into a Singleton since it captures no Scoped state.
- Structured logging on both ends: `LogInformation` for start/complete counts, `LogWarning` (inherited from `OpenLibraryClient`'s existing failure handling) for individual refresh failures — a silent background job would be worse than no job at all.
- **Fully verified for real, not just via unit tests**: backdated one real cached book's `CachedAt` to 60 days old directly in Postgres, started the app, and confirmed via the actual log output that `BackgroundService.ExecuteAsync` ran its first pass immediately on startup (before any delay), correctly identified exactly the one stale book, and successfully refreshed it against the live Open Library API — confirmed directly in Postgres afterward that `CachedAt` updated for the stale book while the two untouched test books' timestamps were unaffected.
- Added 2 unit tests for the staleness-selection logic specifically (the module's explicit ask): stale books get refreshed, fresh ones don't; a batch with nothing stale does nothing. All 25 tests (was 23) pass.

## Concepts you'll learn

- `IHostedService`/`BackgroundService` — how .NET runs long-lived or periodic work inside the same process as your web API, and how that's different from a request-handling controller action.
- When background work is the right call vs. when it's over-engineering: a periodic Open Library cache refresh genuinely benefits from running outside the request path; not everything does.
- Job scheduling options: a simple built-in timer-based `BackgroundService` vs. a library like Hangfire (SPEC.md §5 mentions both as acceptable) — and the trade-off between them (Hangfire adds persistence/retry/dashboard machinery; a plain hosted service is simpler but loses that if the process restarts mid-job).
- Idempotency for retried/repeated jobs — what happens if your refresh job runs twice, or gets interrupted halfway.

## Why this matters

SPEC.md's caching design (module 05) already keeps normal reads fast and independent of Open Library's uptime — but the cache still needs to get refreshed periodically so `cached_at` timestamps don't go stale forever. That's a background concern, not a request-time one: no user's search request should be the thing that triggers a slow external refresh. This module is also a good place to internalize a general rule: background work that fails silently is worse than no background work at all, so logging/observability for jobs matters as much as the job logic itself — the module 08 habit applies here in a slightly different shape than in a request-handling controller.

## The task

Implement a periodic Open Library cache refresh per SPEC.md §5/§8:

- Choose between a plain `BackgroundService` and Hangfire, and be able to justify the choice for this project's scale (a small MVP beta) rather than defaulting to whichever sounds more "production-grade."
- Implement the refresh: find `Books` rows past some staleness threshold, re-fetch via `OpenLibraryClient`, update the cache — reusing the module 05 client rather than duplicating its logic.
- Make the job idempotent: running it twice in a row (or being interrupted mid-run) shouldn't corrupt data or double-charge Open Library's API with redundant calls beyond what staleness actually requires.
- Add logging around the job (start, count refreshed, failures) so a failure is visible, not silent — and write at least one test for the job's core logic (e.g. "rows past the staleness threshold get selected, rows within it don't"), same as every feature since module 09.

## Done when

- [ ] A periodic refresh job runs and actually updates stale `cached_at` rows.
- [ ] You can justify your `BackgroundService` vs. Hangfire choice specifically for this project, not generically.
- [ ] You've reasoned through (and ideally tested) what happens if the job is interrupted mid-run.
- [ ] Job failures are logged in a way you'd actually notice, not swallowed silently, and the staleness-selection logic has a test.

## Go deeper (optional)

- Read about the outbox pattern — not needed here, but it's the standard answer once background work needs to reliably trigger from a database write (e.g. "send an event whenever a Log is created"), which is a natural next step if Phase 2 notifications get built.
