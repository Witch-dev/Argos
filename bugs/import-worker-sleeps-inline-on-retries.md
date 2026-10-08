# One slow import row stalls everyone's imports

**Priority:** P2 · **Size:** M · **Area:** Backend, imports · **Found:** 2026-10-08 (argos-security review of `specs/book-import.md` Phase 3) · **Status:** Fixed 2026-10-08

## What happens

`ImportProcessingService` (lines ~203-207) retries an Open Library failure by sleeping 30 s, then 2 min, inside the single worker, on top of up to two 10 s HTTP timeouts per attempt. That is 3+ minutes per bad row. A file full of ISBNs Open Library is slow to answer for (random valid-checksum ISBNs) can block every other reader's import for an hour, and the scheduler (fewest rows done first) keeps giving the slow job turns. Plausible, not measured.

## Suggested fix

On `Unavailable`, record a retry time on the row and move on to the next row or job instead of sleeping inline.

## Fix (2026-10-08, Apollon f4a246e)

- `ImportRow` gets `Attempts` and `RetryAt` (migration `ImportRowRetryAt`). When Open Library can't answer, the row gets a retry time (30 s, then 2 min) and the worker moves straight on.
- Rows still waiting are skipped, a job whose only pending books are waiting isn't picked, and a job finishes only when nothing is left waiting.
- Test: with a one-hour retry, another reader's import finishes while the slow book waits.

**Follow-up after the security review (same day):** the sleeps were gone, but a file full of slow ISBNs still got turn after turn (set-aside books didn't count as work, and turns went to the job with the fewest books done) and each book could cost two 10 s timeouts. Jobs now take turns least recently served first (`ImportJob.LastTurnAt`, migration `ImportJobLastTurnAt`), and a turn ends after 3 set-aside books in a row.
