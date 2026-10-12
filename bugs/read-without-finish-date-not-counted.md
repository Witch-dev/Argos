# A book saved as Read without a finish date shows as "Finished" but isn't counted

**Priority:** P1 · **Size:** S · **Area:** Frontend (log form), stats · **Found:** 2026-10-12 (checked in the browser after `ux-reviews/books-home.md`) · **Status:** Fixed 2026-10-12 (Apollon f312403)

## What happens

On a book page, "Log this book" with the status set to **Read** and the **Finished** date left empty (it is empty by default) saves without error. Afterwards:

| Where | What it shows |
|---|---|
| Journal (Books home preview and Journal page) | "Finished *Dune*", "Logged Oct 12" |
| "Your 2026 so far" card | **0 books read** |
| Stats page and reading goal | "Nothing finished in 2026 yet", goal progress 0 |

Setting the Finished date to today makes the same book count immediately (verified with a second book). So a reader who marks books Read the quick way sees their year and goal stuck at zero while their journal says they finished them.

## Why

`LogRepository.GetFinishedDatesAsync` counts only `Status == Read` with `FinishedAt` inside the year; `LogService` stores `request.FinishedAt` as sent, and the form sends null when the field is empty. The other way to finish a book, the reading-progress "finish" action, does set `FinishedAt` to now (`LogService.cs` around lines 391 and 406), so only the log form leaves it empty. Imports also create undated Read logs on purpose (Goodreads rows without a date), so a backend default would change those too.

## Suggested fix

1. **In the log form**: when the reader picks Read (or Did not finish) and the Finished date is empty, prefill it with today. It stays editable and clearable. This matches the progress "finish" path and leaves imports alone.
2. Show a short hint next to an empty date on a Read log ("Add a finish date so it counts in your year").
3. Decide what to do with the existing undated Read logs of non-import readers: leave them (they are honest "unknown date" rows), or let the stats fall back to the log's creation date. Imports should stay out of the count unless dated.

Tests: `LogForm.test.tsx` (prefill, and clearing it keeps null); a backend test is not needed if the fix stays in the form.

## Fix

The log form fills today's date when Read or Did not finish is chosen (and when a new log opens as Read), keeps it editable and clearable, and shows "Add a finish date so this book counts in your year" when a Read log has none. Existing logs are not touched, so undated imports stay undated. Backend unchanged. Verified in the browser with a new reader: Read with the date untouched gave 1 on the year card and 1 on the stats page. `LogForm.test.tsx` has five new tests. The third point above (what to do with existing undated Read logs from non-import readers) was left as is.
