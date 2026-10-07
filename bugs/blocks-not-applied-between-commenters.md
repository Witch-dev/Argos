# Blocks don't apply between commenters

**Priority:** P2 · **Size:** M · **Area:** Backend, comments · **Found:** 2026-10-05 (security review of `specs/feed-redesign.md` Phase 2) · **Status:** Fixed 2026-10-07

## What happens

Ana blocks Ben. Both of them comment on Carla's writing (or review, or list). Ben can still see Ana's comments there, vote on them and reply to them, and Ana sees Ben's.

## Why

The block checks compare the viewer with the **owner of the writing** only (`WritingAccess`, `ReviewAccess`, list access). Nothing compares the viewer with the **author of each comment**. Reviews and lists have always worked this way; the feed redesign didn't change it.

Comments are the most likely way a blocked person keeps reaching someone. This overlaps with the "Blocking reaches likes and comments" idea in `FUTURE-IDEAS.md`.

## Suggested fix

In `CommentService` (`Apollon/src/Argos.Api/Services/CommentService.cs`):

- When building a comment thread or highlight list for a signed-in viewer, leave out comments by readers in a block with them (`IBlockRepository.GetHiddenUserIdsAsync`), and replies under those comments.
- Refuse a reply, vote or edit on a comment whose author is in a block with the caller (answer "not found", as elsewhere).
- Comment counts on cards can stay as they are, or subtract hidden comments; decide which is less confusing.

Tests: a thread seen by Ben has no comments from Ana; Ben replying to or voting on Ana's comment is refused.

## Fix (2026-10-07)

Done in `CommentService`, as suggested, with two corrections found in review:

- The "Why" above was wrong about reviews and lists: `ReviewAccess` and list access don't check blocks against the owner at all (only `WritingAccess` does). So the fix also refuses comments, replies, votes and edits when the caller is in a block with the target's **owner**. Without that, hiding comments made things worse: a blocked reader could post under the blocker's review where the blocker couldn't see or remove it.
- Replies, votes and edits are refused anywhere **down** a thread started by someone in a block with the caller, not just on that person's own comment, so they match exactly what the tree hides.

Decisions: comment counts on cards still include hidden comments; logged-out visitors see everything (`blocks-only-apply-signed-in.md`). Known side effect: your own old replies under the other person's comment are hidden from you too (you can still delete them by id). Book club discussions are a separate comment system: `blocks-not-applied-in-club-discussions.md`. See `CHANGELOG.md`, "Blocks now reach comments".
