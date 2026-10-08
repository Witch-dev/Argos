# Book clubs show a member's progress even when that book is private

**Priority:** P3 · **Size:** M · **Area:** Backend, clubs, privacy · **Found:** 2026-10-08 (review and security review of `specs/books-community-split.md` Phase 2) · **Status:** Open

## What happens

A reader marks a book Private (`Log.ReadingVisibility`, `specs/books-community-split.md` §3.2). If they are in a book club whose current book is that book, every member of the club still sees their status, page and percentage on the club page.

Anyone can join a public club instantly, so this is wider than "people I chose to read with". A club admin could also switch the club's book to probe members' shelves, though each switch shows up in the club's activity.

## Why

`ClubService.GetProgressForMembersAsync` (`Apollon/src/Argos.Api/Services/ClubService.cs`) reads members' logs with `ILogRepository.GetByBookIdAndUserIdsAsync`, which has no viewer filter. Phase 2 left it out on purpose: club progress wasn't in §3.4's list, and hiding it changes what clubs are for.

## Decision needed

Which of these is right:

1. **Hide it.** Treat club members like anyone else: filter with `ReadingVisibleTo` for the viewer, so a Private book shows as "no progress" and a Followers-only book shows only to members who follow the reader.
2. **Keep it, and say so.** Being in a club that reads a book is itself a choice to share. Keep the progress visible to members, and state it in the Privacy settings text and on the club page.
3. **Hide it, with a per-club opt-in.** For example, "Share my progress on club books" when joining.

Option 1 is the smallest code change (one filter plus a test). Options 2 and 3 need wording in all five languages.
