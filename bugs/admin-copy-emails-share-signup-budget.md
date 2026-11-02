# Admin copies of feedback and book requests share the daily optional-email budget

**Priority:** P2 · **Size:** S · **Found:** 2026-11-01 (argos-security review of missing-book requests)

Each feedback message and book request queues an email to the admin as optional (`BookRequestService.cs`, `EmailQueue.cs`). Optional emails stop for the day after 80, and sign-up and confirmation emails are optional too. Enough requests (16 readers × 5) would stop sign-up mail until midnight UTC.

**Fix:** give admin copies their own small daily share, as `EnqueueClub`/`ClubDailyLimit` do for club emails. A capped copy loses nothing: the request is still on the admin page.
