# A club says "You've finished the book" on its page and "Not started" everywhere else

**Priority:** P2 · **Size:** M · **Area:** Backend + frontend, clubs · **Found:** 2026-10-18 (shelf refresh Phase 4, ux-review of Clubs)

## What happens

A reader who had already logged Jane Eyre as Read (finished 2026-07) creates a club with Jane Eyre as its first book. The club's page shows "You've finished the book", a full progress bar, "Finished" and "On track", and in Members "Finished". The Clubs directory card ("Your clubs") shows an empty bar and "Not started", and so does the right rail's "My Book Clubs" card on every Community page. `MyClubsCard` shows "Not started" when `MyClubSummaryDto.MyProgressPercentage` is null, so `/clubs/mine` doesn't count the reader's existing log while the club page's member progress does.

Seen with a seeded reader (`sw_…` in the local `argos` database, club "The Tuesday Readers").

## Fix

Work out `MyProgressPercentage` in `/clubs/mine` the same way as `ClubMembershipDto.ProgressPercent` (one shared helper in the club service), so a book you'd already read counts as finished everywhere. Add a test: a reader with a Read log of the round's book gets 100 from both endpoints. Then check the directory card and the rail show "Finished".

## Fixed

2026-10-18: `GetProgressForMembersAsync` (`ClubService.cs`, shared by the club page and `/clubs/mine`) counts a Read log as 100% whatever its page fields say. Integration test `ABookAlreadyRead_CountsAsFinished_OnTheClubPageAndInYourClubs`. Checked on screen: the directory card and the rail say 100%.
