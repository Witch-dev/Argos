# Nobody can leave a book club

**Priority:** P2 · **Size:** M · **Area:** Backend + frontend, book clubs · **Found:** 2026-10-21 (Stage 10 whole-backend review) · **Status:** Fixed 2026-10-21

## What happens

There is no way to leave a club. `ClubsController` has no leave route, and `ClubService.RemoveMemberAsync` only lets an Admin or Moderator remove someone else (a Moderator only plain Members, nobody the Admin). So a plain Member who wants out has to ask a moderator, a Moderator has to ask the Admin, and the Admin can never leave.

The block dialog already promises it: "In a book club you share, you both stay members … You can still leave the club" (`profile.json` → `confirmBlock`, and `bugs/block-detectable-in-shared-club.md`). Today that's not true.

## Suggested fix

- `DELETE /api/clubs/{id}/members/me` for Members and Moderators: deletes the membership and, like removal, their vote on an open round (`ISuggestionVoteRepository.DeleteByRoundAndUserAsync`). Ratings of finished rounds stay.
- The Admin can't leave while others are in the club, since ownership transfer isn't in v1 (`specs/book-clubs.md` §4). Either refuse with a clear message ("Make someone else the admin first" needs transfer, so for now: "The club's creator can't leave yet"), or hand over the way account erasure already does (`AccountErasureRepository.HandOverClubsAsync`: longest-standing Moderator, else member). Handing over reuses tested code and is the kinder answer. A club whose last member leaves is deleted, as erasure does.
- Frontend: a "Leave club" item on the club page's menu with a confirm, five locales.
- Tests: member leaves (gone from members, vote gone), admin leaves (handed over), last member leaves (club gone).

## Fix

- `DELETE /api/clubs/{id}/members/me` (`ClubsController.Leave` → `ClubService.LeaveAsync` → `ClubMembershipRepository.LeaveAsync`). One transaction that locks the club row, so two members leaving at once can't leave the club with an Admin who has gone. A Member or Moderator is simply removed. An Admin hands over the way account erasure does (longest-standing Moderator, else member). The successor query now lives in `ClubSuccession` and both paths use it. The last member's leaving deletes the club. The leaver's vote on a round still in Suggesting is deleted in the same transaction; ratings stay. Someone who isn't an Active member gets a 404.
- Club page: a "⋯" menu next to the club name with "Leave club". The confirm says what leaving does in each case (member / admin handing over / last member deleting the club). After leaving, the page goes to `/clubs`. Five locales (`clubs.page.leave*`, `moreActions`).
- Tests: `ClubsControllerTests.Leave_*` (a member leaves and their vote leaves the count; the admin hands over to the moderator ahead of an earlier plain member; the last member deletes the club along with a comment and its reply), `ClubPage.test.tsx` ("leaving the club"). Browser-checked all three cases, desktop and 375px.
- Left as is (reviewer, low): only leaving takes the club-row lock, so a join or an erasure racing a hand-over can still fail with a 500 that rolls back cleanly. Pending requests and invites go with a deleted club.
