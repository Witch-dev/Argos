# Backend queries that will slow down as readers grow

**Priority:** P3 · **Size:** M (each item S–M) · **Area:** Backend, performance · **Found:** 2026-10-21 (Stage 10 whole-backend review)

None of these hurts at closed-beta size. They're kept together because they're the same kind of problem and will be found together when something gets slow. Fix the one that shows up first (Render's metrics or Sentry's slow transactions), not all at once.

## The list

| Where | What it does | First to hurt |
|---|---|---|
| `ClubService.SearchDirectoryAsync`, `ClubRepository.SearchPublicAsync` | Every public club, unpaged, then 2 queries per club (current round, member count). `GetMyClubsAsync` and `ClubInviteService.GetMyInvitesAsync` do the same per club, but are bounded by the reader's own clubs. | Club directory |
| `DiscoveryService.BrowseAsync` / `GetLikeYouAsync` | Browse loads every Read log in the system with genres; "like you" loads every visible rating on every book the viewer rated. Not rate-limited. | Find readers |
| `NotificationService.CountUnreadAsync` → `ToDtosAsync` | The badge poll checks `CanTakePartAsync` for up to 100 unread comment rows, about 4 queries each. | Every page load for active readers |
| `NotificationRepository.GetDueCheckpointMembersAsync` | Every hourly pass re-checks every unreached member of every checkpoint due in 48 h (≈48 retries each, the unique index makes them no-ops). | Notification job |
| `ReviewSocialRepository` / `WritingRepository` Popular sort, `GetRatingRowsAsync` | Two correlated `COUNT(*)` per row over all visible reviews/writings per page (the writings half is [its own bug](writings-popular-query-cost.md)); every rating of a book loaded into memory per ratings request. | Community → Popular |
| `GET /api/logs?userId=` (`LogsController`, `LogRepository`) | Every log of the reader with Book and ContentWarnings, unpaged, anonymous. | Profiles after a big import |
| `ImportRepository.StageListItemAsync` → `ItemsWithStagedAsync` | Loads the whole list once per imported row (O(n²) for a 5,000-book shelf). Hidden today by Open Library pacing. | Big Goodreads imports |
| `CommentService.IsInHiddenThreadAsync` | One query per thread level when the viewer has any block. | Deep reply threads |
| `BookRepository.GetStaleBooksAsync` | Books whose authors Open Library can't give are re-refreshed every daily run (about 6 paced requests each). Failed refreshes now wait a week (2026-10-21); this case still doesn't. | Refresh job reaching truly stale books |
| `OpenLibraryClient.GetBookAsync`, `AuthorService.GetWorksAsync` | A well-formed id that doesn't exist, or an author with no works, calls Open Library on every view (only the per-client search rate limit protects it). Needs the client to tell "not found" from "unreachable" before it can be cached. | Bots walking ids |
