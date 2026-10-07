---
name: new-endpoint
description: Use when scaffolding, adding, or creating a new backend API endpoint for Argos — triggers on "/new-endpoint", "add an endpoint for X", "scaffold a controller/API for X". Walks through a full vertical slice on the ASP.NET Core backend (DTO → repository → service → controller, plus an EF Core migration if the schema changes) following the layered architecture and constraints in SPEC.md.
---

# New Argos Backend Endpoint

Scaffold one endpoint as a complete vertical slice through Argos's layered backend: **Controller → Service → Repository (EF Core) → PostgreSQL**, per `SPEC.md` (repo root). If the request is ambiguous, ask before scaffolding — endpoint shape is expensive to redo once frontend code depends on it.

## Phase 1 — Confirm the shape

Before writing anything, pin down (ask the user if any are unclear):
1. Resource and route (e.g. `POST /api/logs`, `GET /api/books/{id}`).
2. Request and response fields (the DTO shape) — keep this separate from the EF entity; don't leak EF entities directly over the wire.
3. Whether it touches an existing entity (`Users`, `Books`, `Logs`, `Lists`, `ListItems`, `Follows` — see SPEC.md §7) or needs a new one/migration.
4. Auth requirements: does it need `[Authorize]`? Does it need an *ownership* check (e.g. a user can only edit their own `Log`/`List`), not just "is logged in"?
5. If it involves book data, confirm it goes through `OpenLibraryClient`'s cache — never call Open Library directly from a controller or service.

## Phase 2 — Follow existing patterns first

Read an existing controller/service/repository in the same project as a template before writing a new one — consistency with what's already there beats a "better" one-off pattern. If this is the very first endpoint in the project (no existing pattern to follow), set up the minimal three-project skeleton (`Argos.Api`, `Argos.Domain`, `Argos.Infrastructure`) per SPEC.md §5 rather than inventing a different structure.

## Phase 3 — Build the slice

1. **Domain**: add/extend the entity in `Argos.Domain` if the schema changes.
2. **Migration**: `dotnet ef migrations add <DescriptiveName>` — review the generated migration by hand before applying; `dotnet ef database update` to apply locally.
3. **Repository** (`Argos.Infrastructure`): data-access method(s) using EF Core, no raw/string-built SQL.
4. **Service**: business logic, calls the repository; this is where Open Library calls (via `OpenLibraryClient`), ownership checks, and validation live — not in the controller.
5. **Controller** (`Argos.Api`): thin — parses the request, calls the service, maps to the response DTO, applies `[Authorize]`/ownership checks as decided in Phase 1.
6. **DTOs**: request/response types distinct from the EF entity.
7. **Test**: an xUnit test for the new service logic (happy path + the auth/ownership edge case if relevant). Hand off to the `tester` agent for a fuller pass if the change is large.

## Phase 4 — Verify and hand off

- `dotnet build` and run the new/affected tests — don't declare done on code that hasn't compiled or run.
- State the final route + request/response shape clearly at the end so a frontend change (e.g. via `new-react-feature`) can consume it without re-deriving it.
