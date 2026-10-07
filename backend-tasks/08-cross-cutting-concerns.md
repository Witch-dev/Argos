# 08 — Cross-Cutting Concerns: Middleware, Errors, Logging

*You've just finished a complete, working vertical slice — Books search and detail, end to end through every layer (modules 01–07). Before adding anything new, this module is about making that slice production-quality, and building the habit of doing this for every feature from here on, not just at the very end of the project.*

## Progress

**Status:** ✅ Done

**Decisions made:**
- Global exception handling via .NET 8+'s `IExceptionHandler` (`Argos.Api/Middleware/GlobalExceptionHandler.cs`), not a hand-rolled middleware class — the modern idiomatic pattern. Registered via `AddExceptionHandler<T>()` + `AddProblemDetails()`, activated via `app.UseExceptionHandler()`.
- Pipeline order: `UseExceptionHandler()` goes **first**, before Swagger/HTTPS-redirection/controllers — it can only catch exceptions from things registered after it.
- Response vs. log split: the client gets a generic, safe `ProblemDetails` (`"An unexpected error occurred."`) — the real exception (type, message, full stack trace) goes only to `_logger.LogError(exception, ...)`, never to the response body.
- Added `ILogger<OpenLibraryClient>` and logged the three meaningful moments: cache hit (`LogInformation`), cache miss → fetching (`LogInformation`), and fetch failure (`LogWarning`, deliberately not `LogError` — this is a handled, expected-to-sometimes-happen case, not a crash).
- Consolidated the three separate `catch` blocks in `OpenLibraryClient.GetBookAsync` into one, using an exception filter (`catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)`) — still only catches those three specific types; anything else genuinely unexpected still propagates up to `GlobalExceptionHandler`, per "don't catch exceptions you can't meaningfully handle."
- **Real verification, not just inspection**: temporarily pointed the connection string at an unreachable port (Windows service `Stop-Service` needed admin rights this session didn't have, so this was the workaround) to trigger a genuine unhandled `NpgsqlException`. Confirmed the client received only the generic `ProblemDetails` JSON — no stack trace, no connection string, no exception type — while the server log captured the complete real exception and stack trace under `GlobalExceptionHandler`. Reverted the connection string afterward and confirmed normal operation resumed.

## Concepts you'll learn

- The ASP.NET Core middleware pipeline as a literal pipeline — request flows through middleware in registration order, response flows back in reverse, and *where* you register something (before or after routing/auth) changes what it can see and do.
- Global exception handling: catching unhandled exceptions in one place instead of wrapping every controller action in try/catch, and returning a consistent error shape (tying back to `ProblemDetails` from module 07).
- Structured logging with `ILogger<T>` — logging as structured data (fields), not just string interpolation, and why that matters once you actually need to query logs later.
- The principle of not catching exceptions you can't meaningfully handle — catching-and-swallowing an exception you don't know how to recover from just hides bugs.

## Why this matters

Every module so far has been about building one feature. This one is about the concerns that cut across *all* of them: what happens when something goes wrong anywhere in the app, and how do you find out about it after the fact. A missing global exception handler means every controller either duplicates error-handling boilerplate or leaks raw stack traces to clients (a real security concern, not just an aesthetic one). Doing this now, on the one feature you have, matters more than doing it perfectly later on five — you're establishing the pattern you'll reuse for every feature module from here forward (10–14), not solving it once as an afterthought.

## The task

Add the cross-cutting layer to the Books feature you already have:

- Add global exception-handling middleware that catches unhandled exceptions, logs them with enough context to debug, and returns a consistent `ProblemDetails`-shaped response without leaking internals (stack traces, connection strings) to the client.
- Replace any ad hoc `Console.WriteLine`/string-interpolated logging in `BookService`/`OpenLibraryClient`/`BooksController` with structured `ILogger<T>` calls, using log levels deliberately (what's `Information` vs. `Warning` vs. `Error` in this app).
- Audit your middleware registration order in `Program.cs` and be able to explain why each piece is positioned where it is (exception handling early, routing before endpoint execution — authentication/authorization ordering will matter more once module 10 adds them).
- Confirm it works: trigger a real failure (e.g. a malformed Open Library response, or an unreachable database) and check that it produces a useful, structured log entry and a clean error response instead of a raw exception.

## Done when

- [ ] A global exception handler exists and `BooksController` has no bespoke try/catch-for-logging boilerplate.
- [ ] Logging in the Books slice uses `ILogger<T>` with structured parameters, not string concatenation.
- [ ] You can explain your middleware pipeline's order, top to bottom, and why swapping two entries would break something.
- [ ] You've deliberately triggered a failure and confirmed the log output and error response are both useful, not just present.

## Go deeper (optional)

- Look at correlation IDs (a request ID threaded through all log entries for one request) — useful once more than one middleware/service is logging about the same request.
- Read about the difference between `UseExceptionHandler` and a custom exception-handling middleware, and when each is preferable.
