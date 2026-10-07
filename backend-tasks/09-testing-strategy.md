# 09 — Testing Strategy: Unit vs. Integration Tests

*This is the second habit-forming module, right after module 08. From here on, every feature module (10–14) will ask you to apply what you learn here to that feature specifically — this module is where you learn the pattern once, on the Books slice you already have.*

## Progress

**Status:** ✅ Done

**Decisions made:**
- New test project `Argos.Tests` (xUnit), added to the solution, referencing `Argos.Api`/`Argos.Infrastructure`/`Argos.Domain`.
- **Motivated interface extraction**: introduced `IOpenLibraryClient` specifically because `BookService` unit tests needed to avoid constructing a real `HttpClient` — exactly the trigger module 04 predicted ("a genuine need, not a speculative one"). `OpenLibraryClient : IOpenLibraryClient`; DI registration updated to `AddHttpClient<IOpenLibraryClient, OpenLibraryClient>`.
- Hand-written fakes (`FakeBookRepository`, `FakeOpenLibraryClient`) instead of a mocking library — deliberately, so the "test double" mechanism stays visible rather than hidden behind framework magic.
- Unit tests (`Unit/BookServiceTests.cs`): 3 tests, all fakes, no DB/HTTP, run in milliseconds.
- Integration tests (`Integration/BooksControllerTests.cs` + `ApiFactory`): real HTTP → real controller → real service → **real Postgres**, against a separate `argos_test` database (not the real `argos` one) — reusing the app's existing config wiring (just an overridden connection string) rather than a special test-only code path. `ApiFactory` runs `Database.Migrate()` automatically on host creation.
- `Program.cs` needed `public partial class Program;` added at the end — top-level-statement programs generate an `internal` `Program` class by default, which `WebApplicationFactory<Program>` can't see from another assembly without this.
- **Real environment friction hit and resolved**: .NET 10 SDK dropped `dotnet test`'s old VSTest-compatibility mode for MTP-based projects (xUnit v3 is MTP-native). Fixed via `global.json` (`{ "test": { "runner": "Microsoft.Testing.Platform" } }`) per the current Microsoft Learn guidance, not the older `TestingPlatformDotnetTestSupport` property (deprecated in this mode). Run tests via `dotnet test --project test/Argos.Tests`.
- **Genuinely watched a test fail, not a staged failure**: wrote `Search_ReturnsMatch_WhenQueryHasExtraWhitespace` (padded search query like `"  fox  "`), ran the suite, and it failed for real — `BookService.SearchAsync` wasn't trimming input before searching. Fixed with a one-line `query.Trim()`. Re-ran, all 7 tests passed.
- **Honest nuance, not overclaimed**: the whitespace bug would have been caught by a unit test against the fake too (same `.Contains()` logic), so it doesn't actually demonstrate "mock passes, real DB fails." The genuinely DB-specific failure mode (e.g., Postgres's `LIKE` treating `%` as a wildcard, possibly behaving differently than an in-memory fake) was discussed but not built into a dedicated test this pass — noted here rather than claimed as proven.
- Cosmetic-only xUnit v3 analyzer warnings (`xUnit1051`) about threading `TestContext.Current.CancellationToken` through async calls — fixed; build and all 7 tests confirmed clean afterward.

## Concepts you'll learn

- The test pyramid: what unit tests, integration tests, and end-to-end tests are each actually good at, and why you want more of the cheap/fast kind and fewer of the slow/brittle kind.
- Mocking/faking vs. real dependencies — and specifically *why* SPEC.md's testing constraints (§8) call for real Postgres in integration tests rather than mocking the database: a mocked `DbContext` can pass while the real migration/query is broken.
- Test doubles for the seams you deliberately built: module 04's repository interface exists partly so a service can be unit-tested against a fake `IBookRepository` instead of a real database.
- `WebApplicationFactory` for integration-testing a full ASP.NET Core API in-process, including real middleware and routing.

## Why this matters

This is the module that either validates or exposes every layering decision you made in modules 01–08. If `BookService` depends on `IBookRepository` (an interface, not a concrete class), unit-testing it is straightforward. If `BooksController` is thin, integration tests can exercise real HTTP → real database round-trips without needing to fake half the stack. If any of that isn't true, this module will make it obvious — which is itself useful information about where the architecture needs revisiting, not just a testing task. Learning this now, on one feature, means every feature after this one gets tested as you build it — which is the actual habit that separates "it works on my machine" from professional-grade work.

## The task

Build test coverage for the Books feature, per SPEC.md §8:

- Write a unit test for `BookService` using a fake/in-memory implementation of `IBookRepository` — confirm the search/lookup logic works in isolation from the database.
- Write integration tests for the `BooksController` endpoints (search and detail) using `WebApplicationFactory` against a real test Postgres instance, per SPEC.md's explicit "don't mock the database in integration tests" stance.
- Deliberately write one test that should fail — e.g. looking up a book ID that doesn't exist should return `404`, or an empty search query should be rejected — and confirm it fails for the right reason before you make it pass, not by accident.
- Decide, for each test you write, which category it's in (unit vs. integration) and why — this habit matters more long-term than the specific tests.

## Done when

- [ ] At least one unit test exists that exercises `BookService` with a faked repository, no real database involved.
- [ ] At least two integration tests exist for `BooksController`, running against a real test Postgres instance.
- [ ] You can explain, using your own test suite as the example, why a mocked-database test wouldn't have caught a real migration/query bug.
- [ ] `dotnet test` runs clean, and you've actually watched a test fail (by breaking something on purpose) to confirm it's testing what you think it's testing.

## Go deeper (optional)

- Look at `Testcontainers` for spinning up a real, disposable Postgres instance per test run — a more robust setup than a long-lived shared test database.
- Research "test data builders" as a pattern for keeping integration test setup readable as your entities grow more fields.
