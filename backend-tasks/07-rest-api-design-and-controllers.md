# 07 — REST API Design & Controllers

## Progress

**Status:** ✅ Done

**Decisions made:**
- Routes: `GET /api/books?query=...` (search, books-as-collection with a filter, not `/books/search`) and `GET /api/books/{openLibraryId}` (detail, using the Open Library ID since that's what a search result gives the frontend to link to).
- Status codes: search always `200` (empty array is a valid "no matches," not an error), empty/missing `query` → `400`, detail lookup miss → `404`.
- `BookDto` (`Argos.Api/Dtos/`) mirrors `Book` except drops `CachedAt` — a deliberate example of a DTO hiding an irrelevant-to-the-consumer field, not just a sensitive one (contrast with `User.PasswordHash`, the security-motivated case from module 02). Includes the internal `Id` (not just `OpenLibraryId`) since the frontend will need it later to create `Logs` (module 11).
- `BooksController` uses traditional `[ApiController]`/`ControllerBase` MVC-style controllers (matching `SPEC.md`'s own "Controllers" terminology), not minimal APIs — required adding `AddControllers()`/`MapControllers()` to `Program.cs`, which the template didn't have. Entity→DTO mapping is a private static method in the controller, used by both actions.
- Removed the template's leftover `weatherforecast` sample endpoint and the temporary `/test/openlibrary` endpoint from module 05 — both fully superseded by the real controller.
- Fixed the `NU1903` vulnerability queued from module 01: updating `Microsoft.AspNetCore.OpenApi` to 10.0.11 pulled in a patched transitive `Microsoft.OpenApi`. `dotnet list package --vulnerable --include-transitive` now reports clean.
- Removed .NET's built-in `AddOpenApi()`/`MapOpenApi()` (template leftover) in favor of Swashbuckle exclusively, to avoid two overlapping OpenAPI generators. Swashbuckle needed `AddEndpointsApiExplorer()` + `AddSwaggerGen()` (service registration) and `UseSwagger()` + `UseSwaggerUI()` (middleware, Development-only).
- **Real issue hit and fixed**: `SPEC.md`'s originally-pinned Swashbuckle.AspNetCore `7.x` throws a `TypeLoadException` at runtime on .NET 10 — that version line predates .NET 10 support. Swashbuckle now versions alongside .NET itself (9.x/10.x). Updated to `10.2.3`, confirmed working, and corrected `SPEC.md` §6 to match — a real example of why re-verifying pinned versions against reality (not just trusting what was written earlier) matters.
- Bruno collection created at `bruno/` (collection manifest + a `Local` environment defining `baseUrl` + one `.bru` request per endpoint), using the real values already verified to work (`query=fox`, `OL45804W`).
- End-to-end verification done via real HTTP calls against the running app (not just `dotnet build`): search with empty cache → `200 []`; empty query → `400`; detail lookup → real Open Library fetch succeeded (outage had resolved by this point), correctly mapped and cached; second detail call confirmed a cache hit (identical `Id`); search then found the newly-cached book locally. Swagger UI confirmed serving both endpoints with correct schemas.

## Concepts you'll learn

- REST resource modeling: naming routes around nouns/resources (`/api/books/{id}`) rather than actions (`/api/getBook`), and why that convention exists.
- HTTP verb and status code semantics as a real contract, not decoration — `GET` is safe/idempotent, `POST` creates, `PUT`/`PATCH` update, `404` vs `400` vs `422` mean different things to a client.
- Why you almost never return an EF Core entity directly from a controller, and what a DTO is actually protecting you from (over-posting, accidental field leakage, coupling your API contract to your database schema).
- Model validation at the boundary — where "is this input even well-formed" gets checked before it reaches your service layer.

## Why this matters

The controller is the one layer of this app a frontend developer (future-you, doing the React side) will actually see the shape of. Everything you got right in modules 02–06 is invisible to them; the API contract is the whole interface. This is also where the "entities vs. DTOs" decision from module 02 gets paid off or gets you in trouble: if `BooksController` returns your `Book` entity straight from EF Core, then adding an internal-only field to that entity later silently changes your public API. A thin controller with explicit request/response DTOs is what keeps your database schema and your API contract free to evolve independently.

## The task

Build `BooksController` exposing the `BookService` from module 06:

- Design the routes and verbs for "search books" and "get book detail" following REST conventions, and pick status codes deliberately (what does a search with zero results return vs. a lookup of a book ID that doesn't exist?).
- Define explicit response DTOs distinct from the `Book` entity, even if they look similar right now — this is the seam that will matter the moment `Book` grows a field you don't want public.
- Add basic request validation (e.g. a search with an empty query) and decide what a validation failure returns.
- Keep the controller thin: it should parse the request, call `BookService`, map to a DTO, and return a status code — nothing else.
- Stand up Swagger UI (Swashbuckle.AspNetCore, per SPEC.md §6) now, not later — you want a way to click a button and hit your own endpoint while you're still building it, not just a formal deliverable at the end. Also start a Bruno collection (`bruno/` in the repo root, per SPEC.md §6) with one request for each endpoint you build from here forward; treat it as your everyday manual-testing tool, not a one-off exercise.

## Setting up Swagger and Bruno (mechanics, not a concept to research)

This part is closer to "how" than "why," so it's spelled out directly rather than left as an exercise:

- Add the `Swashbuckle.AspNetCore` package to the API project, register it in `Program.cs`, and confirm `/swagger` serves an interactive UI listing your endpoint(s).
- Install Bruno (desktop app or CLI) and create a `bruno/` folder at the repo root with a collection for Argos; add a request for the search and detail endpoints, pointing at your local dev server, and save them so they're committed with the code.

**Reminder carried over from module 01 setup:** the `webapi` template pulled in `Microsoft.OpenApi` 2.0.0, which `dotnet build` flags with a known high-severity vulnerability (`NU1903`). This is the module where that package actually gets touched (Swagger UI depends on OpenAPI document generation), so this is the right point to update it to a patched version before building anything new on top of it — don't carry the warning further than this.

## Done when

- [ ] Routes follow REST resource conventions and use correct HTTP verbs.
- [ ] Response types are DTOs, not EF Core entities, and you can point to why that matters using a concrete "what if" scenario.
- [ ] Status codes are chosen deliberately for at least: success, not-found, and a validation failure.
- [ ] The controller method bodies are short enough that you could describe each one in a single sentence.
- [ ] Swagger UI is live and shows your endpoint(s); a Bruno collection exists in `bruno/` with a saved request for each one, and both are committed to the repo.

## Go deeper (optional)

- Look at `ProblemDetails` (RFC 7807) as ASP.NET Core's standard shape for error responses — worth adopting now so error handling is consistent once module 08 covers global exception handling.
- Read about the difference between `PUT` (full replace) and `PATCH` (partial update) semantics — relevant once you build update endpoints for `Logs`/`Lists` later.
