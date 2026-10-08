# Import upload shares the login rate-limit bucket, and proxy IPs may not be forwarded

**Priority:** P2 · **Size:** S · **Area:** Backend, security, deploy · **Found:** 2026-10-08 (argos-security review of `specs/book-import.md` Phase 3) · **Status:** Open

## What happens

Upload uses the `auth` policy, the same per-IP bucket as login and register: ten uploads lock that IP out of logging in for a minute. Separately, `Program.cs` has no `UseForwardedHeaders` / `ASPNETCORE_FORWARDEDHEADERS_ENABLED`; behind Render's proxy `RemoteIpAddress` may be the proxy, making every per-IP bucket effectively site-wide. The second part already affects the whole API and must be checked before the public launch.

## Suggested fix

Check the forwarded-headers setup on the deploy host; give imports their own per-user rate-limit policy.
