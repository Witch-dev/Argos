# The Readings strip relies only on follows being removed when someone blocks

**Priority:** P3 · **Size:** S · **Area:** Backend, privacy · **Found:** 2026-10-05 (security review of `specs/feed-redesign.md` Phase 3) · **Status:** Open

## What happens

Nothing visible today. The Readings strip at the top of the home page (`GET /api/feed/activity`) shows reading updates from the people you follow. Blocking someone deletes the follows between you in both directions, so a blocked reader drops out of the strip.

The Feed itself (`GET /api/feed`) also removes readers in a block from its author list as a second line of defence, in case a follow row ever survives a block (for example through a future bug or a manual database change). The strip doesn't have that second check, so in that unlikely case a blocked reader's reading updates would show there.

## Why

`FeedService.GetActivityAsync` → `LogRepository.GetRecentStatusUpdatesByUserIdsAsync` (`Apollon/src/Argos.Infrastructure/Repositories/LogRepository.cs`) takes the followed ids as they are. `FeedService.GetFeedAsync` filters them with `IBlockRepository.GetHiddenUserIdsAsync` first.

## Suggested fix

In `FeedService.GetActivityAsync`, remove `GetHiddenUserIdsAsync(userId)` from the followed ids before querying, the same way `GetFeedAsync` does. Add a test that seeds a follow row after a block and checks the strip leaves that reader out (like `FeedControllerTests.GetFeed_LeavesOutAReaderInABlock_EvenIfAFollowRemains_…`).
