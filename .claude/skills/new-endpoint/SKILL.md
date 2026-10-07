---
name: new-endpoint
description: Use when scaffolding, adding, or creating a new backend API endpoint for Argos — triggers on "/new-endpoint", "add an endpoint for X", "scaffold a controller/API for X". Walks through a full vertical slice on the ASP.NET Core backend (DTO → repository → service → controller, plus an EF Core migration if the schema changes) following the layered architecture and constraints in SPEC.md.
---

# New Argos Backend Endpoint

Scaffold one endpoint as a complete vertical slice through Argos's layered backend: **Controller → Service → Repository (EF Core) → PostgreSQL**, per `SPEC.md` (repo root). Code lives in `C:/Users/jramo/Apollon`. If the request is ambiguous, ask before scaffolding — endpoint shape is expensive to redo once frontend code depends on it.

## Phase 1 — Confirm the shape

Before writing anything, pin down (ask the user if any are unclear):
1. Resource and route (e.g. `POST /api/logs`, `GET /api/books/{id}`).
2. Request and response fields (the DTO shape) — keep this separate from the EF entity; don't leak EF entities directly over the wire.
3. Whether it touches existing entities (check `SPEC.md` §7 and `src/Argos.Domain`, not memory — the model has grown well past the original tables) or needs a new one/migration.
4. Who may call it: `[Authorize]`? An *ownership* or role check (owner, list collaborator, club Admin/Moderator), not just "is logged in"? Visibility (Private/Public/Unlisted) and blocks? Does it post something others can read, so it needs `[RequireConfirmedEmail]`?
5. If it involves book data, confirm it goes through `OpenLibraryClient`'s cache — never call Open Library directly from a controller or service.

## Phase 2 — Follow existing patterns

Read the existing controller/service/repository closest to the new one and match it — consistency with what's already there beats a "better" one-off pattern.

## Phase 3 — Build the slice

1. **Domain**: add/extend the entity in `Argos.Domain` if the schema changes.
2. **Migration**: the user's running API locks `bin/Debug`, so build in Release first: `dotnet build src/Argos.Api -c Release`, then `dotnet ef migrations add <DescriptiveName> --project src/Argos.Infrastructure --startup-project src/Argos.Api --configuration Release --no-build`. Review the generated migration by hand, then apply it with `dotnet ef database update` and the same flags.
3. **Repository** (`Argos.Infrastructure`): data-access method(s) using EF Core, no raw/string-built SQL.
4. **Service**: business logic, calls the repository; this is where Open Library calls (via `OpenLibraryClient`), ownership checks, and validation live — not in the controller.
5. **Controller** (`Argos.Api`): thin — parses the request, calls the service, maps to the response DTO, applies the auth attributes decided in Phase 1.
6. **DTOs**: request/response types distinct from the EF entity.
7. **Error messages**: every new error message gets a code in `src/Argos.Api/Errors/ErrorCodes.cs`, and a translation under `errors.codes` in all five `web/src/locales/<lang>/` files.
8. **Test**: an xUnit test for the new service logic (happy path + the auth/ownership edge case if relevant). For a large change, the main session can follow up with the `tester` agent.

## Phase 4 — Verify and hand off

- `dotnet build -c Release` and `dotnet test test/Argos.Tests -c Release` — don't declare done on code that hasn't compiled or run. Tell the user to restart their API.
- State the final route + request/response shape clearly at the end so a frontend change (e.g. via `new-react-feature`) can consume it without re-deriving it.
