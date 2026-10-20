# Opening a public club from Discover is a dead end for non-members

**Priority:** P1 · **Size:** M · **Area:** Clubs, backend and frontend · **Found:** 2026-10-18 (shelf refresh, Clubs)

## What happens

On the Clubs page, every club under "Discover clubs" links to `/clubs/{id}`. For a reader who isn't a member, `GET /api/clubs/{id}` answers 403 (`ClubService` requires an active membership), so the page shows only "Couldn't load this club: Forbidden". Nothing in the interface calls `joinClub` (`POST /api/clubs/{id}/join`, which exists and works), so a public club can only be joined through its invite link. specs/book-clubs.md §3.5 says a public club is "reachable via the directory".

Seen with a fresh reader opening "Midnight Dystopias" from Discover (screenshot in the Clubs session, 2026-10-18).

## Fix

- Backend: a small public preview of a public club by id for non-members, the same shape as `GET /api/clubs/join/{token}` (name, description, current book, member count). A private club stays 404 or 403 without a token.
- Frontend: on 403 or 404 from the club detail, `ClubPage` shows that preview in the join page's card, with a green "Join club" that calls `joinClub` and then refetches the detail. Reuse `ClubJoinPage`'s card.
- Tests: a non-member opening a public club sees the preview and joins; a private club still says it can't be opened.

## Fixed 2026-10-20

Backend: `GET /api/clubs/{id}/preview` (`ClubService.GetPublicPreviewAsync`) gives a non-member a public club's `ClubJoinPreviewDto` (name, description, current book, and a new `MemberCount`, which the invite page shows too); a private club answers 404. Frontend: the invite page's card is now `ClubJoinCard`; on a 403 or 404 from the club detail, `ClubPage` shows `PublicClubPreview`: the card with a green "Join club" that calls `joinClub` and refetches the detail, or, for a private club, the neutral note "This club is private. Its members can send you an invite link." (five languages). Tests: `ClubsControllerTests.GetPublicPreview_*` (preview and join; private is 404), `ClubPage.test.tsx` (joins and turns into the club; private note). In the browser at 1280 and 375: a fresh reader opened a public club from Discover, saw the card (1 member), joined and got the club page with themselves in Members; a private club showed the note.
