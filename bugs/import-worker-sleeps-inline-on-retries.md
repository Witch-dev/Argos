# One slow import row stalls everyone's imports

**Priority:** P2 · **Size:** M · **Area:** Backend, imports · **Found:** 2026-10-08 (argos-security review of `specs/book-import.md` Phase 3) · **Status:** Open

## What happens

`ImportProcessingService` (lines ~203-207) retries an Open Library failure by sleeping 30 s, then 2 min, inside the single worker, on top of up to two 10 s HTTP timeouts per attempt. That is 3+ minutes per bad row. A file full of ISBNs Open Library is slow to answer for (random valid-checksum ISBNs) can block every other reader's import for an hour, and the scheduler (fewest rows done first) keeps giving the slow job turns. Plausible, not measured.

## Suggested fix

On `Unavailable`, record a retry time on the row and move on to the next row or job instead of sleeping inline.
