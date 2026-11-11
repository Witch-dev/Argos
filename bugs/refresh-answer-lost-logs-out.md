# A renewal whose answer is lost signs the reader out

**Priority:** P3 · **Size:** M · **Area:** Backend + frontend, sessions · **Found:** 2026-11-10 (while writing `specs/stale-tab-recovery.md`)

## What happens

Each refresh swaps the refresh cookie for a new one ("rotation", `specs/account-system.md` §3.2). If the server makes the swap but its answer never reaches the browser (the connection drops mid-answer, or the browser gives up after 20 s while the server is still answering), the browser keeps the old cookie. The server has already retired it, so the next refresh is refused and the reader lands on the login page. Anything they hadn't saved is lost (until drafts, `specs/stale-tab-recovery.md` Phase 2).

Rare: it needs a network failure at exactly the moment of a refresh, which happens about every 15 minutes of use. Most likely right after a laptop wakes on a shaky connection.

## Why

`RefreshTokenService.RotateAsync` (`Apollon/src/Argos.Api/Services/RefreshTokenService.cs`) refuses any revoked token. Within the 60-second `ReuseGracePeriod` it only refuses (no sign-out everywhere), but it still refuses.

## Suggested fix

Within the grace period, a token retired by rotation could be answered with its replacement's session instead of a refusal: issue a fresh token for the same session and retire the replacement, so the browser that lost the answer carries on. Needs an `argos-security` review: it widens what a stolen just-rotated cookie can do for 60 seconds. The alternative is to accept it, since drafts make the cost small.
