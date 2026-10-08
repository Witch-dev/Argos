# Imports have no limit over time, so one account can fill the database

**Priority:** P2 · **Size:** M · **Area:** Backend, imports, security · **Found:** 2026-10-08 (argos-security review of `specs/book-import.md` Phase 3) · **Status:** Fixed 2026-10-08

## What happens

Only one import can be active per reader, but nothing limits how many a reader runs over time. Each finished job keeps its rows (copies of reviews, notes and shelf names) for 30 days, and undone jobs are kept too. A confirmed account can loop upload → finish → upload at about 10 a minute (the `auth` rate limit), adding roughly 7–10 MB of rows per job. That is gigabytes an hour on a small Postgres plan. Ten parallel uploads also each parse a full file in memory (~200 MB live for a worst-case file), which can run a 512 MB instance out of memory.

## Suggested fix

- A per-reader quota (for example a few imports a day), or delete a reader's earlier finished/undone jobs' rows when a new one starts.
- A per-user "parse in progress" guard so parallel uploads don't each parse.
- A separate per-user `imports` rate-limit policy (see [import-upload-shares-login-rate-limit](import-upload-shares-login-rate-limit.md)).

The per-row caps (reads, shelves, review length) were added on 2026-10-08; this is the remaining total-volume risk.

## Fix (2026-10-08, Apollon 7638dff + e7e1651)

- Per-reader `imports` rate limit, 5 uploads an hour (7638dff, with the login-bucket bug).
- At most 3 imports started per reader in 24 hours (`ImportOptions.MaxPerDay`, `imports.dailyLimit`).
- At most 10 imports kept per reader (`ImportOptions.MaxKept`): starting one more deletes the oldest finished one, never one from the last 24 hours. Undo works on any import from the last 7 days, so the original idea of deleting *all* earlier imports' rows was dropped; with 3 a day the deleted one is days old. Worst case per account: about 10 × 8 MB.
- One file read at a time per reader, and at most two across the server (in memory, which is enough for one API instance).

**Follow-up after the review and security review (same day):** upload limit raised to 10 an hour (refused files count too); an import that can still be undone is never deleted (so one account keeps at most about 3 × 7 + 10); old imports are deleted only after the new one is saved; the two-at-a-time gate is held until the rows are saved, since that's where the memory goes. Storage still grows with the number of accounts; sign-up being invite-only is the backstop for the beta.
