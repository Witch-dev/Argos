# Feature Spec — Home Dashboard Redesign (4-Zone Layout)

**Status:** ✅ Implemented (2026-09-27)

## 1. Problem

The current `/` (`HomePage`) is a placeholder (just a heading and one sentence), and `/feed` is a single reverse-chronological list mixing every kind of log activity (status changes and reviews alike) with no other structure on the page.

The user shared an annotated screenshot of Instagram's home screen and asked for the same four-zone layout, translated into Argos concepts:

1. **Top strip** → progress friends have logged for books (not comments/likes on posts — reading activity).
2. **Left column** → the site's navigation menu.
3. **Center column** → reviews that might interest the logged-in user.
4. **Right column** → the logged-in user's own account summary, plus suggested accounts to follow.

This is a redesign of the feed experience, not a brand-new page: it replaces `/feed` itself (confirmed with the user — see §2), splitting its one undifferentiated log list into the zones above.

## 2. Clarifying decisions made (via questions to the user)

- **Replaces `/feed`**, not a new page alongside it. The old single-list `FeedPage` is restructured into this 4-zone layout. `/` (currently a placeholder `HomePage`) redirects to `/feed`, matching how a logged-in user expects their home screen to work — `HomePage.tsx` is removed as a distinct page.
- **Section 1 scope — broadened after a follow-up question.** First answer was "currently-reading friends only" (closest to Instagram's ephemeral 'active now' framing). The user then asked, when deciding where old plain status-change activity should go (see next bullet), for it to land here too. **Final scope: section 1 is every followed user's most recent log that has no review text** — want-to-read, currently-reading, and finished-without-a-review all count as "progress," not just active reads. A log *with* review text is a review, not progress — it belongs in section 3, not here.
- **Where status-only activity goes:** the old `/feed` showed every log, including plain status changes with no review (e.g. "wants to read X"). Rather than keep a second list for these, they move entirely into section 1 (previous bullet). They remain visible via the friend's own profile/log history regardless.
- **Section 3 definition — "reviews from people you follow," not a broader discovery feed.** Scoped explicitly to avoid scope creep into SPEC.md §4 Phase 2's "Basic recommendations" (a real personalized/genre-based recommendation engine is out of scope here — see §4 below). For v1, "might interest" = "a person you chose to follow wrote it," reusing the existing Follow graph with zero new ranking logic.
- **Section 4 suggestions — mutual-follow based ("people you may know").** Chosen over most-active/most-followed or newest-signups because it's computable from existing `Follows` data with no new signals, and gives suggestions actually related to the user's own social graph rather than site-wide popularity.
- **Section 2 sidebar is global, not page-scoped.** `NavBar` is replaced by a persistent left `Sidebar`, used in `Layout.tsx` on every route (matching the Instagram reference and keeping navigation consistent across the app), not just on the feed/home page.

## 3. Design

### 3.1 Layout shell (`Layout.tsx`, `Sidebar` — section 2)

`NavBar.tsx` (horizontal top bar) is replaced by `Sidebar.tsx` (vertical left column), and `Layout.tsx` changes from `<NavBar /><main>` to a persistent two-region shell: fixed-width sidebar + main content area, applied to every route via the existing `<Outlet />`.

Sidebar carries the same links `NavBar` has today — logo/home, search, Feed (→ this redesigned page), News, People, Lists, the logged-in user's profile link, log out / log in — just laid out vertically with icon + label rows instead of a horizontal bar. Existing behavior is preserved exactly (same routes, same auth-conditional rendering); this is a layout change, not a navigation change. The existing responsive collapse-to-hamburger behavior (`isMenuOpen` state in `NavBar.tsx`) carries over: below a breakpoint the sidebar collapses to a toggleable off-canvas panel rather than a permanent column, same interaction shape as today's mobile menu.

Search box: stays part of the sidebar (top), unchanged in behavior — submits to `/search?q=`.

### 3.2 Section 1 — Progress strip (`ActivityStrip`)

New backend endpoint: **`GET /api/feed/activity`** (authenticated) → `List<ActivityItemDto>`.

- `FeedService` gains `GetActivityAsync(Guid userId, int limit = 20)`:
  1. `_followRepository.GetFollowedUserIdsAsync(userId)` — same as `GetFeedAsync` today.
  2. Fetch each followed user's **single most recent log with no review text** (`ReviewText is null or ""`). This needs a new repository method rather than reusing `GetRecentByUserIdsAsync` as-is, since that method returns a flat merged list across all users, not "top 1 per user": `ILogRepository.GetLatestStatusUpdatesByUserIdsAsync(List<Guid> userIds, int limit)` — per user, the newest log where `ReviewText` is null/empty; results themselves then ordered newest-first and capped at `limit` (so the strip shows at most `limit` friends, most-recently-active first, same as Instagram's story ordering).
  3. No pagination/cursor needed — this is a small, capped strip, not an infinite list.
- `FeedController` (or the existing one, new action): `GetActivity()` maps to `ActivityItemDto { UserId, Username, DisplayName, AvatarUrl, LogId, BookOpenLibraryId, BookTitle, BookCoverUrl, Status, CreatedAt }` — same actor-batch-load pattern `GetFeed` already uses (`UserManager.Users.Where(u => actorIds.Contains(u.Id))`, no N+1).

Frontend: `ActivityStrip` component — horizontal-scrolling row of circular avatars (reusing the existing `Avatar` component with a colored ring wrapper, CSS-only, no new asset), each labeled with the friend's username underneath. No "seen/unseen" state — Argos has no read-receipt concept and this isn't manufacturing one.

**Superseded (2026-09-28):** this originally said clicking an avatar navigates straight to the friend's profile, "simplest option," with a click-through modal/story-viewer called out as explicitly out of scope. In practice that felt like too much for a quick glance — replaced by a small popover (book, status, reading-percentage bar, progress note) per `specs/reading-progress-tracking.md` §3.5. Also: a "+" tile now leads the strip for updating your own progress, per the same spec.

Empty state: strip renders nothing (not even an empty placeholder box) when the user follows nobody yet, or nobody they follow has an unreviewed log — avoids an awkward empty strip above real content.

**Superseded (2026-09-28):** the strip now always renders, even with zero friend activity, because it leads with a "+" tile for the viewer's own reading progress (`specs/reading-progress-tracking.md` §3.4) — that tile is relevant regardless of what friends are doing, so there's no longer a truly "empty" state to hide.

### 3.3 Section 3 — Reviews feed (center column)

New backend endpoint: **`GET /api/feed/reviews`** (authenticated, replaces today's `GET /api/feed`) → same `FeedPageResponse` shape as today (`Items`, `NextCursor`, `NextCursorId`), cursor-paginated exactly as now.

- `FeedService.GetFeedAsync` is renamed `GetReviewsAsync` and gets one added filter: only logs where `ReviewText` is not null/empty. Implementation: add an optional `bool reviewsOnly` parameter to `ILogRepository.GetRecentByUserIdsAsync` (default `false`, so nothing else calling it changes behavior) rather than a parallel method — the query shape (cursor window, ordering, `Take`) is identical to today, only the `Where` clause gains one more condition when `reviewsOnly` is true.
- Route rename: `FeedController`'s existing `[HttpGet]` action on `api/feed` moves to `[HttpGet("reviews")]` (`GET /api/feed/reviews`), so `GET /api/feed/activity` (§3.2) can sit alongside it under the same controller/route prefix without a naming collision.

Frontend: existing `FeedItemCard` and its infinite-query/"Load more" pattern (`frontend-tasks/07`) are reused unchanged — same card rendering (actor, status label, book, rating, review text), same `useInfiniteQuery` cursor wiring, just pointed at `/api/feed/reviews` and fed only review-bearing items. This is the center, main-content column of the redesigned page — the largest of the three columns, matching the Instagram reference's proportions.

Empty state: reuse the existing `EmptyMessage` component — e.g. "No reviews yet from people you follow. Find readers to follow on the People page." (linking to `/people`), matching the tone of empty states elsewhere in the app (task 10's `StateMessage` components).

### 3.4 Section 4 — Account summary + suggestions (right column)

**Account summary (top of right column):** a small, static card — `Avatar`, `displayName ?? username`, `@username`, linking to `/u/{username}`. As built: `useAuth()`'s `user` object (from `CurrentUserResponse`) doesn't carry `avatarUrl` — only the public profile endpoint does — so the component also fetches `getUserByUsername(user.username)` (the same call `ProfilePage` already makes, same query key, so it's cache-shared rather than a genuinely new round trip whenever the user has visited their own profile). No "switch account" affordance (Instagram's "Cambiar") — Argos has no multi-account-per-browser concept, so that control doesn't map to anything real here and isn't built.

**Suggested accounts ("People you may know"):** new backend endpoint **`GET /api/follows/suggestions`** (authenticated) → `List<FollowSuggestionDto> { UserId, Username, DisplayName, AvatarUrl, MutualFollowerCount }`, capped at a small number (e.g. 5, matching the reference screenshot's list length).

- `FollowService` gains `GetSuggestedUsersAsync(Guid userId, int limit = 5)`:
  1. `followedIds = GetFollowedUserIdsAsync(userId)`.
  2. New `IFollowRepository` method `GetSuggestedUserIdsAsync(Guid userId, List<Guid> followedIds, int limit)`: for each user in `followedIds`, collect *their* followees (`Follows` rows where `FollowerId` is one of `followedIds`), excluding `userId` itself and anyone already in `followedIds`; group by candidate id, count occurrences (= mutual-connection count), order by count descending, take `limit`.
  3. If that yields fewer than `limit` results (e.g. a new user with 0–1 follows), no backfill/fallback source is added for v1 — a short or empty suggestions list is acceptable and honest rather than padding it with an unrelated ranking signal (see §4).
- `FollowsController` gains `GET api/follows/suggestions`.

Frontend: `SuggestedAccounts` component reuses the existing `UserCard` + `FollowButton` pair, in a vertical list under a "People you may know" heading — same visual building blocks `PeoplePage` already uses, just a shorter, curated list instead of a full search-results page.

### 3.5 Page assembly

New `FeedPage.tsx` (replacing today's single-list version) lays out three columns via CSS Grid: left = `Sidebar` (already handled by `Layout`, not part of this page's own grid), center = `ActivityStrip` (full-width, above the fold) + `ReviewsFeed` stacked vertically, right = `AccountSummary` + `SuggestedAccounts` stacked vertically. Below a responsive breakpoint, the right column moves below the center column (stacked single-column layout) rather than disappearing — consistent with the app's existing responsive approach (task 10).

`HomePage.tsx` and its route are deleted. As built: rather than a client-side redirect, `App.tsx`'s `index` route and its `feed` route both render `<FeedPage />` behind `ProtectedRoute` directly — `/` and `/feed` are two paths to the exact same page, no `<Navigate>` hop.

## 4. Explicitly out of scope

- **Real recommendations** (genre/rating-based personalization) for section 3 — SPEC.md §4 Phase 2 already tracks this separately ("Basic recommendations (from genres/ratings of followed users)"); this feature deliberately stays at "reviews from people you follow," not a recommendation engine.
- **Story-viewer / click-through detail** for section 1 avatars — clicking navigates to the friend's profile; no modal/expanded-story UI.
- **Read/seen state** for progress-strip items — no per-user "seen this" tracking, no visual distinction for new vs. already-viewed activity.
- **Suggestion fallback ranking** (most-followed/newest-signup backfill) when mutual-follow suggestions run short — an empty or short list is acceptable for v1.
- **"Not interested" / dismiss** action on suggested accounts.
- **Multi-account switching** — no equivalent of Instagram's "Cambiar" exists or is being added.
- Any change to how logging/reviewing itself works, or to the `Logs`/`Follows` schema — this feature is entirely query-derived over existing tables, no migration.

## 5. Tasks

### Backend

- [x] `ILogRepository.GetRecentByUserIdsAsync` — add optional `bool reviewsOnly = false` parameter; when true, adds `ReviewText is not null and != ""` to the `Where` clause. No behavior change for existing callers.
- [x] `ILogRepository.GetLatestStatusUpdatesByUserIdsAsync(List<Guid> userIds, int limit)` — new method: per-user latest log with no review text, merged and capped.
- [x] `FeedService.GetFeedAsync` → rename `GetReviewsAsync`, pass `reviewsOnly: true` through to the repository.
- [x] `FeedService.GetActivityAsync(Guid userId, int limit = 20)` — new method per §3.2.
- [x] `ActivityItemDto` (new, `Argos.Api/Dtos/`).
- [x] `FeedController`: existing action moves to `[HttpGet("reviews")]`; new `[HttpGet("activity")]` action, same actor-batch-load pattern as today (no N+1).
- [x] `IFollowRepository.GetSuggestedUserIdsAsync(Guid userId, List<Guid> followedIds, int limit)` — mutual-connection query per §3.4.
- [x] `FollowService.GetSuggestedUsersAsync(Guid userId, int limit = 5)`.
- [x] `FollowSuggestionDto` (new, `Argos.Api/Dtos/`).
- [x] `FollowsController`: `GET api/follows/suggestions`.
- [x] Backend tests: `reviewsOnly` filter (present/absent cases), `GetLatestStatusUpdatesByUserIdsAsync` (one-per-user, ordering, cap), `GetActivityAsync`/`GetReviewsAsync` split behavior, mutual-follow suggestion ranking (including the "fewer than `limit` available" case), route rename doesn't break existing `FeedControllerTests` (update them to hit `/api/feed/reviews`).

### Frontend

- [x] `Sidebar.tsx` (replaces `NavBar.tsx`) — vertical layout, same links/auth-conditional rendering/search box/responsive collapse behavior as today's `NavBar`.
- [x] `Layout.tsx` updated to render `Sidebar` + main content in a persistent two-region shell, applied globally.
- [x] `api/feed.ts`: `getReviews()` (was the feed call, now hits `/api/feed/reviews`), `getActivity()` (hits `/api/feed/activity`); `queryKeys.feed` updated for both.
- [x] `ActivityItemDto`, `FollowSuggestionDto` types in `api/types.ts`.
- [x] `api/follows.ts`: `getSuggestedUsers()`.
- [x] `ActivityStrip` component — avatar row per §3.2, empty-state handling.
- [x] `AccountSummary` component — static card from `useAuth()`, per §3.4.
- [x] `SuggestedAccounts` component — `UserCard` + `FollowButton` list under "People you may know," per §3.4.
- [x] `FeedPage.tsx` rebuilt as the 3-column assembly in §3.5, reusing existing `FeedItemCard`/`useInfiniteQuery` pattern for the reviews column.
- [x] `HomePage.tsx` deleted; `/` route redirects to (or is replaced by) `/feed`.
- [x] Update `FeedPage.test.tsx` for the new page shape (or split into per-component tests for `ActivityStrip`/`SuggestedAccounts`/reviews list, whichever the existing test structure favors).

### Verification & docs

- [x] Live verification against the running dev stack: a user following 2+ people with a mix of reviewed and unreviewed logs sees correct section 1 (unreviewed-only) vs. section 3 (reviewed-only) partitioning; mutual-follow suggestions verified with a real 3-user follow chain (A follows B, B follows C → C suggested to A).
- [x] `CHANGELOG.md` entry once implemented.
- [x] `SPEC.md` touch: §4 Phase 1 "Activity feed" bullet updated to reflect the split into progress-strip + reviews-feed; no domain model changes needed (still query-derived, no new tables).
