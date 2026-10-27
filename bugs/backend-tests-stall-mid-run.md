# The backend test suite sometimes stops partway and never finishes

**Fixed:** 2026-10-26 (Apollon c8dc503) · **Priority:** P2 (developers only, but it also stalls `scripts/precheck.ps1` before a push) · **Size:** M · **Area:** Backend tests

## What happens

A full `dotnet test test/Argos.Tests -c Release` run sometimes stops producing results partway through and never ends. No test has failed at that point. It happened 5 times out of 7 runs on 2026-10-26, between about 9:40 and 11 PM:

| Run | Stopped after | Notes |
|---|---|---|
| 1 | ~13 s | Another session's run may have been going at the same time on `argos_test` |
| 2 | 1140 of 1730 | Private database (`ARGOS_TEST_DATABASE=argos_test_listcovers`), no other run |
| 3 | finished: 1730 passed in 1 min 26 s | same |
| 4 | 330 | same |
| 5 | 1242 | same |
| 6 | (run directly, `Argos.Tests.exe -longRunning 40`) | 5 tests stuck together for 4+ min: `ReviewSocialTests.Popular_RanksLikesThisWeek_ThenAllTime_ThenNewest`, `ReviewPrivacyTests.AHiddenReview_CannotBeReadCommentedOnOrVotedOnThroughItsComments`, `TasteMatchTests.Match_NeedsThreeSharedRatings_AndShowsOnProfileAndSearchCards`, `NotificationTests.ReplyingToYourOwnComment_OnYourOwnThing_NotifiesNobody`, `GoogleSignInTests.GoogleUnreachable_Is503` |
| 7 | Apollon `c676168` with none of that day's uncommitted work, in a separate worktree, its own database | Also stuck: `BookListImprovementsTests.ViewerStatus_PicksTheBestLogPerBook_AndCountsOnlyRead`, `LandingPageTests.RegistrationStatus_ReportsInviteOnly_WhenConfigured` |

Run 7 shows it isn't caused by the list-covers work (Apollon 41b19d3) that was being tested. The stuck tests are in unrelated areas and get stuck at the same moment, so the cause is probably something they share (the test host, the connection pool, or something process-wide), not one test.

The `--timeout 8m` option given to `dotnet test` did not end the stalled run. Only `timeout 300` around the command, or stopping the task, did.

## Cause (found 2026-10-26, from a dump)

A deadlock inside .NET's event-listener machinery, set off by the memory reporter's `AllocationSampler` (Apollon 2199d7e). Every test class has its own `ApiFactory`, so every test host starts a `MemoryReporter`, and each one creates an `AllocationSampler`, an `EventListener`. With ~80 hosts starting and stopping in parallel, two hosts disposing their listener at the same moment took the runtime's two locks in opposite order:

- one thread was in `EventListener.Dispose()`, holding the global listener lock and waiting for the EventPipe dispatcher's lock (`EventPipeEventDispatcher.SendCommand`);
- the other was further along in its own `Dispose()`, holding the dispatcher's lock, and inside `EventPipeInternal.Enable` the runtime called back into `EventSource.SendCommand`, which waits for the global listener lock.

Neither can move. In the dump, 12 more threads were queued behind them: hosts disposing their reporter, or new hosts constructing one (`AllocationSampler..ctor`). Their tests are the "stuck" ones, which is why unrelated tests froze together. Timers kept running (the `[Long Running Test]` lines and the reporter's own two-minute line still appeared), so the process looked alive.

The live API has one host, and so one listener, created at start and disposed at shutdown; nothing races it.

## Fix

Apollon c8dc503: `ApiFactory` takes `MemoryReporter` out of the test hosts (a test run never needs the two-minute report). With that change, five full runs in a row on a private database (`ARGOS_TEST_DATABASE=argos_test_stall`) all finished: 1730 passed each time, in 67 to 72 s. Before it, two of two runs that day stalled (one dumped).

## Leads, now answered

- What changed recently that runs in every test host: the memory reporter that names allocation types (Apollon 2199d7e, an `EventListener` on GC allocation events), and the `Heavy:` logging (Apollon fe03913, be141d3). An `EventListener` callback that takes a lock the test thread holds would freeze several tests at once. Try a run with the reporter switched off in the test host.
- A browser-check side API (port 5259) and the dev database were running at the same time: check Postgres `max_connections` against the pools the tests open.
- Take a dump of the stuck `Argos.Tests.exe` (`dotnet-dump collect -p <pid>`, then `clrstack -all`) to see where the stuck tests' threads wait.
