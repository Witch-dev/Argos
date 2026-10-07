# Blocks only apply while signed in

**Priority:** P3 · **Size:** L · **Area:** Backend, privacy · **Found:** 2026-10-05 (security review of `specs/feed-redesign.md` Phase 2) · **Status:** Open — by design for now

## What happens

If Ana blocks Ben, Ben can't see, like or comment on Ana's writings while he's logged in. But if Ben logs out, he can read all of Ana's writings and their comments, because writings are public to logged-out visitors.

It also lets Ben find out he's blocked: the same writing shows when he's logged out and says "not found" when he's logged in.

## Why

`WritingAccess` (`Apollon/src/Argos.Api/Services/WritingAccess.cs`) only checks blocks when there is a logged-in viewer. Logged-out visitors see everything, because writings have no privacy setting yet. That matches the spec today (`specs/feed-redesign.md` §3.3), so this is a known limitation rather than a mistake in the code.

## Suggested fix

This can't be fully solved by blocking alone: anyone can always log out, or make a second account. The real fix is privacy settings for writings (and accounts), already planned in `FUTURE-IDEAS.md` under "Account-level privacy settings". Once a writing can be "followers only", a blocked reader (who loses the follow) can't see it logged out either.

When that feature is built, `WritingService.SetLikedAsync`/`GetByIdAsync` and `CommentService.GetTargetContentAsync` must check the new visibility too (noted in `FUTURE-IDEAS.md`).
