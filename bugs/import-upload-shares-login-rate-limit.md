# Import upload shares the login rate-limit bucket, and proxy IPs may not be forwarded

**Priority:** P2 · **Size:** S · **Area:** Backend, security, deploy · **Found:** 2026-10-08 (argos-security review of `specs/book-import.md` Phase 3) · **Status:** Fixed 2026-10-08 (the code part; the deploy check is on `ROADMAP.md` Stage 4)

## What happens

Upload uses the `auth` policy, the same per-IP bucket as login and register: ten uploads lock that IP out of logging in for a minute. Separately, `Program.cs` has no `UseForwardedHeaders` / `ASPNETCORE_FORWARDEDHEADERS_ENABLED`; behind Render's proxy `RemoteIpAddress` may be the proxy, making every per-IP bucket effectively site-wide. The second part already affects the whole API and must be checked before the public launch.

## Suggested fix

Check the forwarded-headers setup on the deploy host; give imports their own per-user rate-limit policy.

## Fix (2026-10-08, Apollon 7638dff)

- New `imports` rate-limit policy: 5 uploads per reader per hour (`RateLimits:ImportsPerHour`), keyed by user id, so readers on one network don't share it and it never touches the login bucket.
- `UseAuthentication` now runs before `UseRateLimiter`, so the policy knows the reader.
- A refused upload gets its own message (`imports.tooManyUploads`) instead of "wait a minute".
- Forwarded headers: still to do on the deploy host, already listed under ROADMAP Stage 4 "Security setup".
