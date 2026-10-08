# Imports have no limit over time, so one account can fill the database

**Priority:** P2 · **Size:** M · **Area:** Backend, imports, security · **Found:** 2026-10-08 (argos-security review of `specs/book-import.md` Phase 3) · **Status:** Open

## What happens

Only one import can be active per reader, but nothing limits how many a reader runs over time. Each finished job keeps its rows (copies of reviews, notes and shelf names) for 30 days, and undone jobs are kept too. A confirmed account can loop upload → finish → upload at about 10 a minute (the `auth` rate limit), adding roughly 7–10 MB of rows per job. That is gigabytes an hour on a small Postgres plan. Ten parallel uploads also each parse a full file in memory (~200 MB live for a worst-case file), which can run a 512 MB instance out of memory.

## Suggested fix

- A per-reader quota (for example a few imports a day), or delete a reader's earlier finished/undone jobs' rows when a new one starts.
- A per-user "parse in progress" guard so parallel uploads don't each parse.
- A separate per-user `imports` rate-limit policy (see [import-upload-shares-login-rate-limit](import-upload-shares-login-rate-limit.md)).

The per-row caps (reads, shelves, review length) were added on 2026-10-08; this is the remaining total-volume risk.
