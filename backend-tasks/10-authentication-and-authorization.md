# 10 — Authentication & Authorization

## Progress

**Status:** ✅ Done

**Decisions made:**
- **Adopted full ASP.NET Core Identity** (not just its `PasswordHasher` utility) — a deliberate architectural decision, made after confirming email-confirmation and forgot-password flows are genuinely planned (see `SPEC.md` §4 Phase 2, §5). This accepts a real, visible crack in the "Domain has zero technology awareness" rule: `User` (renamed `ApplicationUser`, now inheriting `IdentityUser<Guid>`) moved out of `Argos.Domain` entirely into `Argos.Infrastructure/Identity/`, since it's now inherently framework-coupled.
- `ArgosDbContext` now inherits `IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>` instead of plain `DbContext`. `RequireUniqueEmail = true` set explicitly (Identity doesn't enforce this by default — noticed while reviewing the migration).
- New migration (`SwitchToAspNetCoreIdentity`) dropped the old hand-rolled `Users` table and created Identity's full schema (`AspNetUsers`, `AspNetRoles`, `AspNetUserClaims`, `AspNetUserLogins`, `AspNetUserRoles`, `AspNetUserTokens`, `AspNetRoleClaims`) — reviewed before applying per the module 03 habit; confirmed `Books` was completely untouched by the diff. `AspNetUserTokens` is literally the table your future email-confirmation/password-reset tokens will live in.
- JWT config (`JwtOptions`: Issuer, Audience, SigningKey, ExpirationMinutes) lives in `Argos.Api/Configuration/`, bound via the Options pattern (consistent with `DatabaseOptions`), with a randomly-generated 64-byte dev-only signing key in `appsettings.Development.json`.
- `TokenService` (JWT issuance) registered as **Singleton**, not Scoped — deliberately, since it touches nothing Scoped (no `DbContext`), unlike everything else registered so far. The reverse lesson from module 01: not everything needs to be Scoped, only things that depend on something that is.
- `AuthController`: `POST /api/auth/register`, `POST /api/auth/login` (both via `UserManager<ApplicationUser>`, which handles password hashing/verification internally), and `GET /api/auth/me` (`[Authorize]`-protected, reads the current user's ID from JWT claims) — added specifically to have a real, protected endpoint to test against, since `BooksController`'s endpoints are intentionally public. Login intentionally returns the same generic `401` for "no such user" and "wrong password," to avoid leaking which emails are registered (user enumeration).
- Login updates `user.LastLoginAt` — real, verified purpose for the field added back in module 03's schema-change exercise.
- **Two genuine bugs hit and fixed for real, not staged**:
  1. `[Authorize]` was redirecting to `/Account/Login` instead of returning `401` — `AddIdentity(...)` registers its own cookie scheme as default, and passing a scheme name to `AddAuthentication(...)` afterward doesn't fully override that. Fixed by explicitly setting both `DefaultAuthenticateScheme` and `DefaultChallengeScheme` to the JWT bearer scheme.
  2. Even after that fix, `/me` still returned `401` with a valid token — a classic .NET JWT gotcha: `JwtSecurityTokenHandler`'s legacy inbound claim mapping silently renames `"sub"` to a long WS-Federation-era URI when *reading* an incoming token, even though it's written as plain `"sub"`. Diagnosed via a temporary `OnAuthenticationFailed` logging hook (removed once the cause was found), fixed with `options.MapInboundClaims = false`.
- **Fully verified against the real running app**, not just `dotnet build`: register → valid JWT; `/me` without token → `401`; `/me` with valid token → `200` with correct user data; wrong password → `401`; duplicate email → `400` with a clear message; `LastLoginAt` confirmed updated directly in Postgres.
- **Concrete ownership-check plan for module 11** (satisfying the "logged in isn't sufficient" requirement): `/me`'s pattern — read the current user's ID via `User.FindFirstValue(JwtRegisteredClaimNames.Sub)` — is exactly the building block module 11 reuses. A `Log` write endpoint will read the caller's ID the same way, compare it against the `Log.UserId` being modified, and reject with `403 Forbidden` (not `401`) on a mismatch — `401` means "I don't know who you are," `403` means "I know exactly who you are, and this isn't yours."

## Concepts you'll learn

- The distinction between authentication (who are you) and authorization (what are you allowed to do) — and why conflating them is a common source of real security bugs.
- ASP.NET Core Identity's responsibilities: password hashing (and why you never write this yourself), user storage, and how it plugs into EF Core.
- JWTs: what's actually inside one (header/payload/signature), why they enable *stateless* auth (no server-side session store), and what that trade-off costs you (e.g. you can't easily "log out" a JWT server-side without extra machinery).
- Claims-based identity — a JWT doesn't carry a `User` object, it carries claims, and your app decides what to trust from them.
- The `[Authorize]` attribute and policies, and the more subtle idea of **ownership-based authorization** — "is logged in" and "owns this resource" are different checks, and this project needs the second one everywhere a user edits their own data.

## Why this matters

This is the module where getting the concept wrong has actual consequences, not just messy code. A classic bug in social apps exactly like this one: an endpoint checks `[Authorize]` (are you logged in?) but not ownership (is this *your* review/list?), so any logged-in user can edit anyone else's `Log` by guessing an ID. SPEC.md's constraints and the `security-review` agent both call this out specifically. Understanding *why* JWTs are stateless — and what that means for revocation — also matters for judgment calls later (e.g. token expiry length is a real security/UX trade-off, not an arbitrary number).

## The task

Wire up authentication per SPEC.md §5/§9 Phase 2:

- Set up ASP.NET Core Identity for user storage and password hashing.
- Implement register and login endpoints that issue a JWT on success.
- Configure JWT validation (issuer, audience, lifetime, signing key) and protect at least one existing endpoint with `[Authorize]`.
- Explicitly design an ownership check pattern you'll reuse in module 11 (Logs) — e.g. a small helper or policy that confirms the authenticated user's ID matches the resource's owner ID — and be ready to explain why `[Authorize]` alone wouldn't have been enough there.
- Apply the habits from modules 08–09: add structured logging for auth failures (a failed login is worth logging, deliberately, without logging the password) and at least one test — unit or integration — covering a rejected unauthenticated/invalid-credentials request.

## Done when

- [ ] Register/login work end-to-end and return a valid JWT.
- [ ] At least one endpoint rejects an unauthenticated request and accepts an authenticated one.
- [ ] You can explain, without notes, the difference between authentication and authorization using a concrete example from this app.
- [ ] You have a concrete plan (even if not yet applied) for how ownership checks will work in module 11, and can explain why "logged in" isn't sufficient there.
- [ ] Auth failures are logged (module 08 habit) and covered by at least one test (module 09 habit).

## Go deeper (optional)

- Read about refresh tokens and why short-lived access tokens + a refresh flow is the common pattern for balancing security and UX — SPEC.md doesn't require this for MVP, but it's worth understanding the trade-off you're accepting by skipping it for now.
- Look at ASP.NET Core's policy-based authorization (`AddAuthorization` with custom requirements/handlers) as the more scalable version of the ownership check you're building here by hand.
