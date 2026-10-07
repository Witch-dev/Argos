# What You'll Learn Building the Argos Backend

*A theme-based map of the `backend-tasks` curriculum, for a junior .NET engineer aiming for mid-level.*

## What actually separates junior from mid-level

It's not more syntax, more frameworks memorized, or more lines of code per hour. The gap is usually in five things:

1. **Judgment about trade-offs.** A junior engineer can implement "the repository pattern." A mid-level engineer can tell you *when not to* — and defend the call. Every module in this curriculum that says "be ready to explain why" is training this specifically.
2. **Ownership of a feature's full lifecycle.** A junior engineer writes code that satisfies the ticket. A mid-level engineer writes code that's tested, handles its failure modes, is observable when it breaks in production, and doesn't silently corrupt data if it runs twice. That's why modules 08–09 (logging/errors, testing) are deliberately positioned early and then re-applied to every feature after — this curriculum is training the habit of treating those as part of "done," not extra credit.
3. **Reading and reasoning about existing systems, not just writing new code.** Modules 03 (migrations) and 12 (N+1 queries, generated SQL) specifically ask you to read what a tool generated on your behalf and evaluate it, rather than trusting it blindly.
4. **Security and correctness under adversarial-ish conditions.** "Does it work when I click through it" is a junior bar. "Does it reject the request when someone who isn't supposed to succeed tries anyway" (module 10's ownership checks, reinforced in 11/13) is a mid-level bar.
5. **Communicating decisions.** Being able to explain *why* — to a reviewer, to a teammate, to your future self six months later — is what the "Done when" checklists are training every module, not as busywork but because it's the actual skill that gets tested in a real code review.

Everything below maps that growth onto concrete topics in the curriculum.

## Software Architecture & Design

| Concept | Where | Junior → mid-level shift |
|---|---|---|
| Layered architecture & dependency direction | 01 | Junior: puts code wherever it compiles. Mid: knows *why* Domain can't reference Infrastructure, and what breaks if it did. |
| Dependency injection & service lifetimes | 01 | Junior: DI is "how you get an instance." Mid: knows Scoped vs. Singleton is a correctness issue (captive dependencies), not a style choice. |
| Repository pattern — and its trade-offs | 04 | Junior: applies patterns because a tutorial said to. Mid: can argue *against* a pattern when it doesn't earn its keep, for this specific project's size. |
| Adapter pattern / anti-corruption layer | 05 | Junior: deserializes a third-party API response straight into the domain model. Mid: isolates external shape changes so they don't cascade into your schema. |
| Cache-aside pattern | 05 | Junior: caches ad hoc, inconsistently. Mid: names the pattern, knows its failure modes (stale data, cache stampede), and applies it deliberately. |
| Service layer responsibilities ("fat controller" / "anemic domain") | 06 | Junior: doesn't notice when logic drifts into the wrong layer. Mid: recognizes the smell and knows where the line actually is — and that the line depends on context. |
| Background job architecture | 14 | Junior: does slow work inline in a request. Mid: recognizes what belongs off the request path, and knows the idempotency implications of retries. |

## Data & Persistence

| Concept | Where | Junior → mid-level shift |
|---|---|---|
| ORM fundamentals & EF Core change tracking | 02 | Junior: "I set the property and saved and it worked." Mid: understands *why* — and can debug the case where it doesn't. |
| Entities vs. DTOs | 02, 07 | Junior: returns the EF entity from the controller because it's faster. Mid: knows the specific ways that bites you later (over-posting, schema coupling, accidental leakage). |
| Migrations as versioned schema change | 03 | Junior: runs `dotnet ef database update` and moves on. Mid: reads the generated SQL before applying it and knows why editing an applied migration is dangerous. |
| Relational modeling: many-to-many, self-referencing, ordered collections | 12, 13 | Junior: reaches for whatever EF Core's conventions default to. Mid: makes and can defend a specific modeling choice (e.g. ordering strategy for `ListItems`). |
| N+1 queries & pagination | 12 | Junior: doesn't notice a feed endpoint issuing 50 queries. Mid: checks generated SQL/query counts as a habit and picks a pagination strategy that fits the access pattern. |
| Referential integrity & cascade behavior | 13 | Junior: accepts whatever EF Core's default `OnDelete` behavior happens to be. Mid: sets it deliberately and can explain the consequence. |

## APIs & Contracts

| Concept | Where | Junior → mid-level shift |
|---|---|---|
| REST resource modeling & HTTP semantics | 07 | Junior: routes and verbs are whatever felt natural. Mid: status codes and verbs are a deliberate, consistent contract. |
| API contract stability | 15 | Junior: renames a field without thinking about who's calling it. Mid: distinguishes breaking from non-breaking changes before making them — critical the moment a frontend depends on this API. |
| OpenAPI/Swagger documentation | 07, 15 | Junior: documentation is an afterthought or missing. Mid: treats the generated contract as something a future consumer (including future-you) can rely on without asking questions. |
| Bruno as executable API documentation | 07, 15 | Junior: manual testing is ad hoc curl commands or clicks no one else can reproduce. Mid: keeps a git-committed, shareable record of real requests/responses — including authenticated flows — that doubles as onboarding material for the next person (or future-you). |

## Security

| Concept | Where | Junior → mid-level shift |
|---|---|---|
| Authentication vs. authorization | 10 | Junior: conflates "logged in" with "allowed." Mid: knows these are separate checks and where each one lives. |
| JWTs & stateless auth | 10 | Junior: "JWT is how login works." Mid: knows what's actually inside one, why statelessness is a trade-off, and what revocation costs. |
| Ownership-based authorization | 10, 11, 13 | Junior: adds `[Authorize]` and considers auth "done." Mid: knows `[Authorize]` alone doesn't stop user A from editing user B's data, and tests for it specifically — this is the single most common real-world bug class in apps shaped like Argos. |
| Secrets management | 16 | Junior: a connection string ends up hardcoded "just for now." Mid: knows exactly what goes wrong when that "now" becomes permanent, and externalizes it from the start. |

## Testing & Quality

| Concept | Where | Junior → mid-level shift |
|---|---|---|
| The test pyramid | 09 | Junior: tests are something you write if there's time left. Mid: knows what each test *type* is actually good at, and writes the cheap kind by default. |
| Real dependencies vs. mocks | 09 | Junior: mocks the database because it's easier to set up. Mid: knows a mocked DB test can pass while the real query/migration is broken — and specifically why that's dangerous. |
| Test doubles via interfaces | 04, 09 | Junior: doesn't notice that a concrete-class dependency makes a class untestable. Mid: designed the seam (the interface) *before* needing to test it. |
| Reviewing your own work critically | 17 | Junior: "it works, ship it." Mid: runs a second pass — self-review or a reviewer agent/colleague — before calling something done, and treats findings as signal, not noise. |

## Operability & Production Readiness

| Concept | Where | Junior → mid-level shift |
|---|---|---|
| Middleware pipeline & global error handling | 08 | Junior: try/catch scattered per-controller, inconsistent error responses. Mid: one consistent, centralized story for "what does the client see when something breaks." |
| Structured logging | 08 | Junior: `Console.WriteLine` or string-interpolated logs no one can query later. Mid: logs as structured, queryable data — because someone (possibly you, at 2am) will need to query it later. |
| Background job idempotency | 14 | Junior: doesn't consider what happens if a job runs twice. Mid: designs for it, because in distributed/retry-prone systems it *will* happen eventually. |
| Containerization & environment config | 16 | Junior: "works on my machine." Mid: the same image runs correctly against a different connection string with zero code changes. |
| Health checks | 16 | Junior: assumes the process being up means the app is healthy. Mid: knows a health check should verify real dependencies, not just that the process didn't crash. |

## How to use this document

Read it once now, before starting module 01 — not to memorize it, but so the *shape* of the whole journey is in view before you're deep in any one piece of it. Come back to it at module 17 (the wrap-up) and honestly self-assess: for each row, can you explain the "mid-level shift" in your own words, using something you actually built in Argos as the example? If a row still feels shaky, that's useful information — it tells you exactly where to spend more time, either by revisiting that module or by asking for it to be explained differently.
