# A new endpoint is public unless someone remembers [Authorize]

**Priority:** P3 · **Size:** S · **Area:** Backend, access control · **Found:** 2026-10-22 (OWASP Top 10 pass, A01 "Broken Access Control") · **Status:** Fixed 2026-10-22

## What happens

Nothing is wrong today: all 53 endpoints a logged-out visitor can call were checked on 2026-10-22, and each is meant to be public (profiles, books, lists, reviews, sign-up and login) and applies the block, private-account and per-reading rules.

The risk is the next endpoint. About half the controllers put `[Authorize]` on each action instead of on the class, so an action added without it is open to anyone, and no test notices.

## Why

`Program.cs` calls `AddAuthorization()` with no fallback policy, so "no attribute" means "anyone". A fallback policy (`RequireAuthenticatedUser`) isn't a clean fix: the admin controllers deliberately have no `[Authorize]` so outsiders get 404 rather than 401, and all the public endpoints would need `[AllowAnonymous]`.

## Suggested fix

One unit test that lists every controller action an anonymous visitor can reach (no `[Authorize]` / `[RequireAdmin]` on the action or its class, or `[AllowAnonymous]`) and compares it to an allowlist in the test. A new public endpoint then fails the test until it's added to the list on purpose. The list from the 2026-10-22 check is the starting allowlist (route + action name).

## Fixed

2026-10-22. `test/Argos.Tests/Unit/AnonymousEndpointsTests.cs` lists every controller action a logged-out visitor can reach (no `[Authorize]` / `[RequireAdmin]` on the action or its class, or `[AllowAnonymous]` on either) as `VERB route`. Every public method counts, so one without `[HttpGet]` etc. (open to any method) shows as `ANY route` and compares it to an allowlist. A new open endpoint fails the test, and so does one that's no longer open, so the list stays exact. The starting list has 54 entries (one more than the 53 counted in the OWASP pass; all are the intended public reads, sign-up, login and account-link doors). The only route outside controllers is `/health`.
