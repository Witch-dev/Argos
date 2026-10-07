# 02 — Domain Modeling & EF Core Fundamentals

## Progress

**Status:** ✅ Done

**Decisions made:**
- `User` (`Argos.Domain/User.cs`): `Id` is a `Guid`. `Username`, `Email`, `PasswordHash` are required (`string`, defaulting to `string.Empty`, never null). `DisplayName`, `Bio`, `AvatarUrl` are nullable (`string?`, no default) since "never set" is a real, meaningful state for them, unlike the required fields. `CreatedAt` is a plain `DateTime`.
- `Book` (`Argos.Domain/Book.cs`): `Id` is a `Guid`. `OpenLibraryId`, `Title`, `CachedAt` are required. `FirstPublishYear` (`int?`), `CoverUrl`, `Description` are nullable — Open Library doesn't always have them. `Authors`, `Subjects`, `Isbns` are `List<string>` defaulting to an empty list (`= new()`), never null, since a book can have several of each.
- Neither entity has any EF Core–specific attributes on it (no `[Required]`, no data annotations) — deliberately, to keep Domain persistence-ignorant. All mapping rules live in Infrastructure via Fluent API instead.
- `ArgosDbContext` (`Argos.Infrastructure/ArgosDbContext.cs`) registers `DbSet<User> Users` and `DbSet<Book> Books`, both via the `Set<T>()` pattern (not a plain auto-property + `null!`).
- One Fluent API rule is in place: a unique index on `Book.OpenLibraryId` (in `OnModelCreating`), so Postgres itself rejects caching the same Open Library book twice.
- Decided: controllers will **never** return `User`/`Book` entities directly — always a separate DTO. Concrete reason agreed on: `User.PasswordHash` would otherwise be one accidental serialization away from leaking to a client. DTOs themselves aren't built yet — that happens in module 07 when the actual controllers exist.
- Packages added to `Argos.Infrastructure`: `Microsoft.EntityFrameworkCore` (10.0.11), `Npgsql.EntityFrameworkCore.PostgreSQL` (10.0.3) — both resolved cleanly, no vulnerability warnings.
- `ArgosDbContext` is now registered in DI via `AddDbContext` in `Program.cs` (done as module 03 prep — see module 01's Progress notes for the Scoped-lifetime reasoning).

## Concepts you'll learn

- What an ORM actually does: the mapping between rows/columns and objects/properties, and where that mapping is allowed to leak into your design vs. where it shouldn't.
- `DbContext` and `DbSet<T>` as the Unit of Work / Repository-ish abstraction EF Core gives you for free.
- Change tracking — how EF Core knows what SQL to generate from `SaveChanges()` without you writing any SQL, and why that's both powerful and a common source of "why did it update every column" bugs.
- Entity design vs. DTO design — why the class EF Core maps to a table is often *not* the same shape you want to send over the wire (this sets up module 07).
- Fluent API configuration vs. data annotations, and why larger projects lean toward Fluent API for anything non-trivial.

## Why this matters

Every backend eventually has to answer: "where does the truth about my data live, and how much does the database's shape leak into my C# code (and vice versa)?" EF Core gives you a lot of rope here — you *can* pass EF entities straight out through your API, and it'll work, right up until you add a computed property, a password hash, or an internal-only field to an entity and accidentally serialize it into a public JSON response. Understanding change tracking also matters operationally: EF Core doesn't send SQL the moment you set a property — it batches everything until `SaveChanges()`, which is why "did my update actually happen" bugs are almost always a missing `SaveChangesAsync()` call, not a logic error.

## The task

Model the first two entities from SPEC.md §7 — `Users` and `Books` — and stand up the `DbContext`:

- Design the `User` and `Book` entity classes in `Argos.Domain`, matching the fields in SPEC.md §7, thinking about which fields are required vs. optional and why (e.g. a `Book` sourced from Open Library might genuinely have no description — model that as nullable, don't fake a default).
- Create the `DbContext` in `Argos.Infrastructure`, register the `DbSet<User>` and `DbSet<Book>`, and configure at least one non-trivial mapping decision using Fluent API (for example: the `Books.subjects`/`authors` array fields, a unique index on `Books.open_library_id`, or a max length on `Users.username`) rather than reaching for a data annotation by default.
- Deliberately decide: will your API controllers ever return a `User` or `Book` entity directly, or will there be a separate response shape? You don't have to build the DTOs yet (that's module 07) — just make the call and be ready to explain it.

## Done when

- [ ] `User` and `Book` entities exist in Domain with no EF Core–specific attributes bleeding into them unnecessarily (Fluent API in Infrastructure is doing the mapping work instead, where it makes sense).
- [ ] The `DbContext` builds and at least one Fluent API configuration is in place.
- [ ] You can explain what change tracking is doing between "I set `book.Title = x`" and "the UPDATE statement actually runs."
- [ ] You've made and can justify the entity-vs-DTO decision above, even though the DTOs come later.

## Go deeper (optional)

- Read about EF Core's `AsNoTracking()` and when read-only queries should use it (performance implication of change tracking you're not using).
- Look at the difference between owned entity types and separate related entities in EF Core — relevant once you get to `subjects`/`authors` as array-ish data on `Book`.
