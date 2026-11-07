# The "checkpoint due" notification test sometimes fails in a full run

**Priority:** P2 · **Size:** S · **Area:** Backend tests (flaky test)

## What happens

`NotificationTests.CheckpointDue_IsSentOnce_ToMembersWhoHaveNotReachedIt` failed once in two full runs of the backend suite (2026-11-01, while checking Apollon 8c9c991 on a private test database). The last check failed: it expects the club's Admin to have no notifications, but they had one, with no actor and created during the run.

```
NotificationTests.cs:410  Assert.Empty() Failure: Collection was not empty
Collection: [NotificationDto { Actor = null, ActorCount = 1, … }]
```

Run alone (`--filter NotificationTests`) it passed twice in a row.

## Likely cause

A notification with no actor is a reminder that a job sends. Something other than the test's own `job.RunOnceAsync()` probably sent one to the Admin as well: the app's hosted reminder job running on its timer inside the test server, or another test class's job run at the same time over the shared database. The test's club has a checkpoint the Admin hasn't reached either.

## Fix

Find which notification it was (log `reminder.Type` in the failing check), then either stop the hosted jobs in `ApiFactory`, or have the test check that the Admin got no notification *of this kind for this club*, if the Admin is meant to be skipped.

## More occurrences, 2026-11-07 (it is a family, not one test)

Pushing Apollon a1a6ec1 (a search-ranking change nothing here touches), the precheck's full `dotnet test` run failed. A different test failed in each full run, none on a private database:

| Run | Failed | Failure |
|---|---|---|
| 1 and 2 | `ContentLanguageTests.TheBackfill_LabelsOldRows_UsesTheSiteLanguageForShortOnes_AndLeavesRatingOnlyLogsNull` and `NotificationTests.CheckpointDue_IsSentOnce_ToMembersWhoHaveNotReachedIt` | `Assert.Equal()` differs; `Assert.Empty()` not empty (a no-actor notification, as above) |
| 3 (parent commit, separate worktree) | `ContentLanguageTests.TheBackfill_…` only | same |
| 4 | `ClubSuggestionKindsTests.ACheckpointOnATextRound_RemindsThoseNotFinished_WithoutPages` | `Assert.DoesNotContain()`: a no-actor notification (already read) was in the list |
| 5 | none; the push went through | |

Each passes when run alone (`ContentLanguageTests` plus `NotificationTests.CheckpointDue` together: 23 of 23), and no other dotnet or test process was running. Likely the same cause for all three: tests share one database and either run a background job (a reminder job, or `ContentLanguageBackfill.RunAsync`, which labels *every* unlabelled row, not just the test's) or assert on notifications another class's job also creates. `TheBackfill_…` ends with `Assert.Equal(0, RunAsync(...))`, which fails whenever another test has left an unlabelled row at that moment.

Fix for the whole family: stop the hosted jobs in `ApiFactory`, and make each test check only its own rows (this club, these users) instead of the whole table or "nothing else was sent". Related: [chat-erasure-test-races-moderation-erasure.md](chat-erasure-test-races-moderation-erasure.md).

## Fixed 2026-11-07 (Apollon ed8d341)

A full run on a private database (`argos_test_flaky`) passed once before the fix, so the failure did not reproduce on demand; the cause was found by reading the code. Confirmed in code: `NotificationBackgroundService` was hosted in every test host and ran once at start over every club in the shared database; `Program.cs` also runs `ContentLanguageBackfill` at every host start; and any class's `RunOnceAsync` reaches other classes' clubs. Fix, tests only: `ApiFactory` removes the hosted reminder job (tests still call `RunOnceAsync`); `NotificationTests` and `ClubSuggestionKindsTests` hard-delete stray `CheckpointDue` rows for their own readers before the pass they assert on (dismissing keeps a read row); `ContentLanguageTests` checks only its own rows. Three full runs in a row on the private database: 2051 of 2051 each.
