# The activity part of the Feed reads every followed reader's whole history

**Priority:** P2 · **Size:** M · **Area:** Backend, performance · **Found:** 2026-10-05 (security and code review of `specs/feed-redesign.md` Phase 3) · **Status:** Fixed 2026-10-07 (see "Fix" at the bottom and `CHANGELOG.md`, "The Feed's activity rows no longer read whole histories")

## What happens

Each time the Feed loads a page, the activity query takes **every** event ever recorded by every reader you follow, converts each one to your time zone, groups them by reader and day, and only then keeps the newest page. The follow-up query that loads the events for the rows on the page does the same for those readers' whole history before filtering by day.

This runs on **every page of the default All feed**, not only under the Activity filter, and page 30 costs the same as page 1. Liking an activity row also refreshes every cached Feed page, which reruns it. Today this is quick: the dev database has about 90 events. But the cost grows with "people you follow × everything they've ever done", so a reader who follows many active readers makes every one of their Feed requests heavier, and that uses shared database time.

## Why

`ActivityRepository.GetGroupsAsync` and `GetEventsForGroupsAsync` (`Apollon/src/Argos.Infrastructure/Repositories/ActivityRepository.cs`) have no date limit. The cursor (`before`) is applied after grouping, and the day filter in the second query is applied after the time-zone conversion, so the `(UserId, CreatedAt)` index barely helps. The "newest event of each group" (`g.OrderByDescending(…).First()`) probably becomes a per-group subquery that repeats the whole visibility filter; confirm with `ToQueryString()` / `EXPLAIN`.

## Suggested fix

- **All filter (exact, no behaviour change):** once the reviews/writings query has returned its `pageSize + 1` rows, call the oldest of them T. No activity group older than T can make the page, and a group ending at or after T has all its events within one local day, so filtering events to `CreatedAt >= T - 24h` before grouping (and keeping groups with `LatestAt >= T`) loses nothing.
- **Activity filter:** widen a lookback window (for example 7 days, then 30, then everything) until `take` groups are found.
- Also add `CreatedAt < before + 1 day` when there's a cursor.
- In `GetEventsForGroupsAsync`, turn the list of days into a `CreatedAt` range (earliest day − 1 day to latest day + 1 day, to allow for time zones) before converting, so the index can be used.
- Check with `EXPLAIN ANALYZE` against a database seeded with a few thousand events.

Related: [Writings' Popular list ranks every writing on every request](writings-popular-query-cost.md), the same kind of cost.

## Fix (2026-10-07)

Done as suggested, plus one more fix:

- `GetGroupsAsync` takes `notBefore`. Events older than `notBefore − 2 days` are skipped before grouping (2 days is longer than any local day, even a 25-hour one). Groups whose newest event is older than `notBefore` are dropped. With a cursor, events from 2 days after it onward are skipped too.
- `FeedService.GetActivityGroupsAsync`: when reviews/writings returned a full page, the floor is their oldest row. Otherwise it tries 7 days and 30 days back from the cursor (or now), then everything.
- The `First()` subquery was the main cost, as suspected: it rescanned the reader's events once per group. It's replaced by a lookup of the visible event at exactly `LatestAt` (the id breaks a tie).
- `GetEventsForGroupsAsync` narrows by `CreatedAt` (earliest day − 1 day to latest day + 2 days) before converting time zones.

`EXPLAIN ANALYZE` with 6 readers × 1,500 events over 2 years (about 9,000 rows): 3,165 ms before. After: 0.7 ms for a 7-day page, 29 ms when it falls back to reading everything.
