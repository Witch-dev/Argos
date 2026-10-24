# Book clubs show a member's progress even when that book is private

**Priority:** P3 · **Size:** M · **Area:** Backend, clubs, privacy · **Found:** 2026-10-08 (review and security review of `specs/books-community-split.md` Phase 2) · **Status:** Fixed 2026-10-23 (option 2)

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

## Fixed

2026-10-23, option 2 (decided in `specs/stronger-clubs.md` §2.1, built in its Phase 1): joining a club that reads a book is a choice to share your progress on that book, so members keep seeing it, and the app now says so in three places: under the members list on the club page ("Members see each other's progress on the club's book, even if it's private on their shelf."), in Settings → Privacy & data under "All your books at once", and in the privacy policy's "Who can see what you post". Readers who blocked the viewer stay hidden from them, as before.
