# 16 — Deployment Readiness: Containerization & Environments

## Progress

**Status:** ✅ Done

**Decisions made:**
- **A real environment gap, closed first**: Docker wasn't installed on the dev machine at all (no WSL2 either). Installed WSL2 + Docker Desktop before writing anything, specifically so every claim below could be genuinely verified against a real container rather than reasoned about in the abstract.
- **Custom `IHealthCheck`, not a NuGet package**: wrote `PostgresHealthCheck` (in `Argos.Api/HealthChecks/`) calling `ArgosDbContext.Database.CanConnectAsync()` directly, registered via the built-in `AddHealthChecks().AddCheck<T>()` — no extra dependency needed (`AddDbContextCheck<T>` would've required one). Mapped at `/health` via `MapHealthChecks`. Matches the project's running "boring by design" pattern (same reasoning as `BackgroundService` over Hangfire in module 14).
- **A genuine gap found and fixed**: nothing in the app ever called `Database.Migrate()` — only the test project's `ApiFactory` auto-migrated. A fresh Postgres (exactly what a real deploy or a new compose stack gets) would have started successfully and then failed every single request with no tables. Added `dbContext.Database.Migrate()` right after `builder.Build()`, before the request pipeline. Deliberately simple for this project's scale: safe and idempotent for a single API instance; would need a separate migration step instead if this ever ran as multiple concurrent instances, which is out of scope here.
- **Multi-stage Dockerfile**: an SDK-based `build` stage that restores and publishes, and a separate `aspnet`-runtime-only final stage that copies just the published output — the shipped image never contains the SDK. `.csproj` files are copied and restored *before* the rest of the source specifically so Docker's layer cache can skip `dotnet restore` on source-only changes.
- **A real, caught-before-shipping bug**: the first Dockerfile draft would have copied local `bin/`/`obj/` folders into the image via `COPY src/ src/`, since those directories physically exist on disk from local `dotnet build` runs. Fixed with a `.dockerignore` excluding `**/bin/`, `**/obj/`, plus `test/`, `bruno/`, `.git/` — caught by reasoning through what the COPY instruction actually does, not by hitting a bug later.
- **Postgres in compose mapped to host port 5433, not 5432** — the dev machine's local Postgres service already owns 5432; this avoids a silent port collision.
- **Secrets externalized via environment variables, not appsettings**: `docker-compose.yml` supplies `Database__ConnectionString` and `Jwt__SigningKey` (double-underscore is ASP.NET Core's config-binding convention for nested keys) as environment variables, sourced from a gitignored `.env` (confirmed via `git check-ignore -v .env`, not assumed) with a committed `.env.example` template. `appsettings.json` (loaded in every environment, including Production) has zero secret sections, and no `appsettings.Production.json` exists — Production has *no* fallback source for these values, so a missing env var fails loudly instead of silently reusing a dev value.
- **Secrets audit result**: grepped the whole codebase for connection strings/signing keys. Found exactly two hardcoded values — `appsettings.Development.json` and the test project's `ApiFactory.cs` — both confirmed to be local-only, non-sensitive placeholders (`localhost`, `postgres`/`postgres`, a throwaway `argos_test` database) that are never loaded outside Development/test runs. Nothing secret reaches a real deployment.
- **Fully verified for real against actual containers, in this order**: (1) built the image standalone and confirmed it produces a working artifact; (2) ran `docker compose up --build` from a completely fresh Postgres volume and confirmed `/health` came back `Healthy` *and* a real `/api/auth/register` call succeeded — proving `Database.Migrate()` genuinely created every table, not just that the container started; (3) ran `docker compose stop postgres` and confirmed `/health` flipped to `503 Unhealthy` within seconds, with no API restart; (4) ran `docker compose start postgres` and confirmed `/health` recovered to `Healthy` on its own, no restart needed; (5) `docker compose down` for a clean teardown.

## Concepts you'll learn

- Containerizing a .NET app with Docker, including multi-stage builds (a build image with the full SDK, a runtime image with just what's needed to run — and why shipping the SDK in production is wasteful and slightly riskier).
- Environment-based configuration (`Development`/`Staging`/`Production`) and `ASPNETCORE_ENVIRONMENT` — how the same code behaves differently (e.g. detailed error pages only in Development) without a code change.
- Secrets management: why a connection string or JWT signing key belongs in environment variables/a secrets manager, never committed to source, and what actually goes wrong when it is (this ties back to module 08's "don't leak internals" point, from the other direction).
- Health checks as a first-class concept — a `/health` endpoint isn't decoration, it's what your hosting platform/load balancer uses to know your app is actually alive and able to reach its database.

## Why this matters

Everything so far has run on your machine, against your local Postgres, with you as the only "operator." Deployment is where all the implicit assumptions from that setup get tested: does the app actually start with a *different* connection string supplied via environment variable, or did a hardcoded value sneak in somewhere? Does it fail loudly and clearly if the database is unreachable, or hang? This module is less about learning a new pattern and more about pressure-testing everything built so far against a more realistic environment than your dev machine.

## The task

Prepare the backend for deployment per SPEC.md §9 Phase 6:

- Write a multi-stage Dockerfile for the API project, and confirm the resulting image actually runs and serves requests.
- Extend `docker-compose` (from Phase 0 setup) to run the API alongside Postgres, with the connection string supplied via environment variable/config — not hardcoded anywhere.
- Add a health check endpoint that verifies real dependencies (at minimum, that it can reach Postgres), not just "the process is up."
- Audit the whole codebase for anything secret (connection strings, JWT signing keys) that's currently hardcoded or committed, and move it to configuration/environment variables.

## Done when

- [x] The API runs correctly from its Docker image, not just from `dotnet run` on your machine.
- [x] Configuration (connection string, JWT key) is fully externalized — you can point to zero hardcoded secrets in source.
- [x] The health check endpoint fails meaningfully when Postgres is unreachable (test this by actually stopping the database container).
- [x] You can explain what a multi-stage Docker build is doing and why the final image doesn't contain the full .NET SDK.

## Go deeper (optional)

- Look at `dotnet user-secrets` for local development secrets management, as the dev-time equivalent of the environment-variable approach you're using for deployment.
- Research the readiness vs. liveness health check distinction (common in container orchestration) — not required for SPEC.md's current hosting scope, but useful vocabulary for later.
