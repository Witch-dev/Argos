# A time zone .NET knows but Postgres doesn't would break the Feed

**Priority:** P3 · **Size:** S · **Area:** Backend, Feed · **Found:** 2026-10-05 (security review of `specs/feed-redesign.md` Phase 3) · **Status:** Open

## What happens

The Feed sends the reader's time zone (for example `Europe/Madrid`) so a day's activity row ends at their midnight. Two edge cases:

1. **A name .NET accepts but Postgres doesn't.** The API checks the name with .NET's time zone list, then Postgres does the actual conversion with its own list. If the two lists disagree on a name (for example a very new or renamed zone), Postgres throws and that reader's Feed request fails with a 500. Only that reader is affected.
2. **The server is deployed with "invariant globalization".** In that mode .NET's check (`TimeZoneInfo.TryConvertIanaIdToWindowsId`) always fails, so every reader silently gets UTC days. Rows would split at the wrong hour for anyone not in UTC; nothing would error.

## Why

`ActivityService.NormalizeTimeZone` (`Apollon/src/Argos.Api/Services/ActivityService.cs`) validates against .NET's data, while the query runs Postgres's `AT TIME ZONE`.

## Suggested fix

- Quickest: catch the Postgres error in `FeedService` and retry the activity query with UTC.
- Or validate against Postgres instead: cache the names from `SELECT name FROM pg_timezone_names` (once at startup or hourly) and accept only those, falling back to UTC.
- Before deploying, check `InvariantGlobalization` isn't enabled for the API (`Argos.Api.csproj` / Docker image), or switch to the Postgres-based check above, which doesn't depend on it.
- Confirm the production error handler never returns exception text (it currently returns a generic 500).
