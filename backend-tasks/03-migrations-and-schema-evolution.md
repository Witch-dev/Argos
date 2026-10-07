# 03 — Migrations & Schema Evolution

## Progress

**Status:** ✅ Done

**Decisions made:**
- Postgres 17 installed natively on Windows via `winget` (not Docker — deferred to module 16, see reasoning discussion). Running as Windows service `postgresql-x64-17`. Silent install happened to set the `postgres` superuser password to `postgres`, matching the placeholder already in `appsettings.Development.json` — no config changes needed.
- `ArgosDbContext` registered in DI via `AddDbContext` in `Program.cs` (prerequisite for the EF tooling to construct it) — see module 01's Progress notes for the full reasoning.
- Added `Microsoft.EntityFrameworkCore.Design` (10.0.11) to `Argos.Api` — required by the `dotnet ef` CLI tool on the *startup* project specifically; not needed at runtime, only for tooling.
- First migration (`InitialCreate`) generated via `dotnet ef migrations add --project src/Argos.Infrastructure --startup-project src/Argos.Api --output-dir Migrations`, reviewed line by line, then applied via `dotnet ef database update`. Created the `argos` database itself (didn't exist before), plus `Books`/`Users` tables and the unique index — all verified directly with `psql`, not just trusted from the command's log output.
- Confirmed `List<string>` (`Authors`/`Subjects`/`Isbns`) maps automatically to Postgres's native `text[]` array column type with zero extra Fluent API config — the concrete payoff of the earlier Postgres-vs-SQL-Server decision.
- Second migration (`AddUserLastLoginAt`) added a nullable `DateTime? LastLoginAt` to `User`, generated as a *new* migration rather than editing `InitialCreate` (the forward-only habit). Confirmed it came out as a small, targeted diff (one `AddColumn`) rather than a full schema rebuild — direct, observed evidence of how migrations diff against the snapshot rather than regenerating everything each time.
- Noted, not yet acted on: the `dotnet-ef` global tool (10.0.7) is slightly behind the EF Core runtime packages (10.0.11) — cosmetic warning only so far, worth updating eventually.

## Concepts you'll learn

- How EF Core migrations actually work: it diffs your current model against a snapshot of the last migration, not against the live database.
- Why migrations are the professional answer to "how does a team keep its database schema in sync across dev machines, CI, and production" instead of everyone hand-running `ALTER TABLE`.
- The forward-only philosophy: why you (almost) always write a *new* migration to fix a mistake rather than editing or deleting an already-applied one.
- Reading generated SQL critically — knowing when EF Core's guess at a migration is wrong or dangerous (e.g. a column rename that EF Core sees as "drop + add," silently losing data).

## Why this matters

The moment more than one person (or one person plus a deployment pipeline) touches a database, "I'll just modify the table myself" stops working — nobody else's local database or production's database gets that change. Migrations turn schema changes into versioned, reviewable, replayable code, the same way Git turns source changes into versioned, reviewable, replayable history. The habit of *reading* a generated migration before applying it — not just trusting the tool — is what separates "EF Core did something to my database" from actually understanding your own schema.

## The task

Generate and apply your first real migration from the entities in module 02:

- Generate a migration for the `Users` and `Books` tables.
- Before applying it, read the generated migration file end to end and identify: what table(s) it creates, what indexes/constraints it adds, and whether anything in it surprises you compared to what you expected from your entity design.
- Apply it to your local Postgres instance and confirm the schema matches what you designed (inspect the actual tables, not just "no error was thrown").
- Make one small deliberate schema change afterward (e.g. add a field you forgot) and generate a *second* migration for it, rather than editing the first — this is the habit that matters more than the specific change.

## Done when

- [ ] Two migrations exist: the initial one and a follow-up change.
- [ ] You can explain, in your own words, how EF Core decided what SQL to generate for the first migration (what it diffed against).
- [ ] You've actually opened the generated migration files and can point to a specific line and say what it does — not just "I ran the command and it worked."
- [ ] You can explain why editing an already-applied migration is risky once other environments (or teammates) have run it.

## Go deeper (optional)

- Look at what `dotnet ef migrations script` produces — the raw SQL a migration would run — and compare it to what actually executed.
- Research how migrations handle a genuinely destructive change (e.g. dropping a column with data in it) and what a safer, multi-step rollout looks like in a live system (expand/contract pattern).
