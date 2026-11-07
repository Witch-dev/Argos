# The chat erasure test fails when the moderation tests erase every due account at the same time

**Priority:** P2 · **Size:** S · **Area:** Backend tests (flaky test)

## What happens

`ClubChatTests.ErasingAnAccount_MovesKeptMessagesToDeletedUser_OrRemovesThem` failed once (2026-11-01, filter `ClubChat|Notification|Moderation|Block` on a private test database, while building `specs/club-chat-bell.md`). Run alone it passed three times in a row.

```
ClubChatTests.cs:451  Assert.True() Failure  (erasure.EraseAsync(leaver.UserId) returned false)
```

## Cause

The test marks two readers as deactivated 40 days ago and erases them one by one. `ModerationTests.cs:780` calls `AccountErasureService.EraseDueAsync()`, which erases **every** account that is due across the shared database. When the two test classes run at the same time, the moderation test erases the chat test's reader first, and `EraseAsync` then finds no deactivated account and returns false.

## Fix

Have the test that sweeps every due account run in a collection that doesn't run in parallel with tests that make due accounts (`[Collection]` with `DisableParallelization`), or let `EraseDueAsync` take the ids it may touch in tests.

## Fixed 2026-11-07 (Apollon ed8d341)

`AccountErasureTests` and `StrongerListsTests` (both sweep with `EraseDueAsync`) now share a `DisableParallelization` collection (`ErasureCollection`), so they run alone, after the parallel classes. The moderation test asks `GetDueAsync` instead of sweeping. Three full runs on a private database: all 2051 passed.
