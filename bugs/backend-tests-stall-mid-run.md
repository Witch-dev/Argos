# The backend test suite sometimes stops partway and never finishes

**Priority:** P2 (developers only, but it also stalls `scripts/precheck.ps1` before a push) · **Size:** M · **Area:** Backend tests

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

## Leads, not checked

- What changed recently that runs in every test host: the memory reporter that names allocation types (Apollon 2199d7e, an `EventListener` on GC allocation events), and the `Heavy:` logging (Apollon fe03913, be141d3). An `EventListener` callback that takes a lock the test thread holds would freeze several tests at once. Try a run with the reporter switched off in the test host.
- A browser-check side API (port 5259) and the dev database were running at the same time: check Postgres `max_connections` against the pools the tests open.
- Take a dump of the stuck `Argos.Tests.exe` (`dotnet-dump collect -p <pid>`, then `clrstack -all`) to see where the stuck tests' threads wait.

## Until it's fixed

Run with a hard limit (`timeout 420 dotnet test …`) and, if it stops, run again. A run that finishes is trustworthy: no stall has ever ended with a failed test.
