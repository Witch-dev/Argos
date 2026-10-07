# 01 — Solution Architecture & Dependency Injection

## Progress

**Status:** ✅ Done

**Decisions made:**
- Code lives in a separate repo/folder, `C:\Users\jramo\Apollon` (its own git repo, pushed to `github.com/Witch-dev/Apollon`, `main` branch) — not inside `Argos`. No tooling (agents/skills) is shared between the two; see `Argos/.claude` for what only exists here.
- Solution name and project namespaces stay `Argos.*` (the product name) even though the outer repo folder is called `Apollon`.
- Three projects created with a one-directional reference chain: `Argos.Domain` (no references) ← `Argos.Infrastructure` (references Domain) ← `Argos.Api` (references both).
- Postgres connection string is handled via the Options pattern: a `DatabaseOptions` class (just a `ConnectionString` property) lives in `Argos.Infrastructure/Configuration/`, and is bound in `Argos.Api/Program.cs` from a `"Database"` section in `appsettings.Development.json`. The actual value there is a local-dev placeholder (`Host=localhost;Port=5432;Database=argos;Username=postgres;Password=postgres`) — not a real secret, fine for now per SPEC.md's module 16 deferral.
- `ArgosDbContext` is registered in `Program.cs` via `AddDbContext`, which registers it Scoped by default. Walked through concretely (during module 03 prep) why Scoped matters specifically for a `DbContext`: it isn't thread-safe and tracks changes per unit of work, so a Singleton instance shared across every concurrent request would let one request's tracked changes leak into another's. Scoped gives every request its own fresh instance.
- The registration reads the connection string via `IOptions<DatabaseOptions>` (resolved from the DI container at DbContext-creation time), not by re-reading raw configuration — keeping the Options-pattern box from earlier actually load-bearing rather than bypassed.

## Concepts you'll learn

- Why real .NET backends are split into multiple projects instead of one, and what rule governs which project is allowed to depend on which.
- The Dependency Inversion Principle — the difference between "my code calls a concrete class" and "my code calls an interface, and something else decides which implementation shows up."
- The built-in DI container: service *lifetimes* (Transient, Scoped, Singleton) and why picking the wrong one causes real bugs (e.g. a Singleton accidentally holding onto a Scoped EF Core `DbContext`).
- The Options pattern for configuration, and why "just read `appsettings.json` directly wherever you need a value" doesn't scale.

## Why this matters

A single-project "put everything in one folder" API works fine at 500 lines and becomes unmanageable at 5,000 — not because of file count, but because nothing stops a controller from reaching directly into the database, or a domain class from accidentally depending on ASP.NET. Splitting into projects turns an architectural *intention* (SPEC.md's Controllers → Services → Repositories layering) into something the compiler enforces: if `Argos.Domain` can't reference `Argos.Infrastructure`, your domain model *cannot* accidentally take a dependency on EF Core, no matter how tired you are at 11pm.

Dependency injection is the mechanism that makes this layering practical without manual object-wiring everywhere. It's also what makes testing possible later (module 09) — a service that asks for `IBookRepository` in its constructor can be tested with a fake one; a service that `new`s up a concrete `BookRepository` internally cannot.

## The task

Set up the solution skeleton described in SPEC.md §5 and §9 Phase 0:

- Three projects with a one-directional dependency chain: a **Domain** project with no dependencies on anything else, an **Infrastructure** project that depends on Domain (this is where EF Core lives), and an **Api** project that depends on both (controllers, DI wiring, `Program.cs`).
- Decide, and be able to justify, what belongs in each project as you go — a good test is: "could I reuse this project's contents with a completely different web framework, or a completely different database?" Domain should survive that test; Infrastructure and Api shouldn't need to.
- Wire up basic DI registration in `Program.cs` for whatever services exist so far, thinking explicitly about lifetime for each: what should be Scoped (hint: anything touching a `DbContext` per request), what could be Singleton (stateless, thread-safe things), and why nothing here should be Transient by default.
- Set up configuration via the Options pattern for at least one setting (the Postgres connection string is the obvious first one) instead of reading `IConfiguration` ad hoc.

## Done when

- [ ] The solution builds with three projects and the dependency direction is enforced by project references, not just convention.
- [ ] You can explain, without looking it up, what would break if `Argos.Domain` referenced `Argos.Infrastructure`.
- [ ] You can explain why a Scoped service registered as Singleton is a bug, using the `DbContext` example specifically.
- [ ] At least one setting is read through the Options pattern rather than `IConfiguration["Key"]` scattered around.

## Go deeper (optional)

- Look up "Clean Architecture" / "Onion Architecture" — SPEC.md's three-project layering is a lightweight version of the same idea, and it's worth understanding what the fuller version adds (and why the spec deliberately doesn't adopt all of it yet).
- Read Microsoft Learn's docs on ASP.NET Core dependency injection service lifetimes for the precise rules on captive dependencies (a longer-lived service holding a shorter-lived one).
