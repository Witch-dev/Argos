# Blocks don't apply in book club discussions

**Priority:** P3 · **Size:** M · **Area:** Backend, clubs · **Found:** 2026-10-07 (security review of the commenter-blocks fix) · **Status:** Open

## What happens

Ana and Ben are both in a book club. Ana blocks Ben. In the club's checkpoint discussions they still see, reply to and vote on each other's comments.

## Why

Checkpoint discussions use their own comment system (`CheckpointDiscussionService`, `ICheckpointCommentRepository`), separate from `CommentService`, and it never looks at blocks. `ClubInviteService` stops new invites between the two, but members who joined before the block stay together.

## Needs a decision first

A club is a space both people chose to join, so it's not obvious the block should split it. Options:

- Treat it like other comments: hide each other's comments and refuse replies/votes (same approach as `CommentService.WithoutBlockedThreads`).
- Leave it, and tell the blocker in the block dialog that shared clubs aren't affected, so they can leave the club.

Belongs with Stage 7 (Safety) in `ROADMAP.md`.
