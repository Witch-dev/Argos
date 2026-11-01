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
