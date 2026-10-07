# 07 — Social: Follow/Unfollow, Activity Feed, User Search

**Status:** ✅ Done

## Scope

- Follow/unfollow button (used on profile page, task 06) — `POST /api/follows` / `DELETE /api/follows/{followeeId}`, optimistic update via React Query mutation + cache invalidation.
- `/feed` — reverse-chronological activity feed, `GET /api/feed?before=&beforeId=&pageSize=`, cursor-based "load more" (infinite scroll or a button — pick whichever is simpler to get right first, infinite scroll is a nice-to-have polish pass later).
- Each feed item: who logged what book, status, rating, review snippet, link to the book and to the actor's profile.
- User search (SPEC.md §4: "User search") — search box + results list, similar shape to book search (task 03).
- Followers/following lists on the profile page (task 06) — count + expandable list.

## Depends on

Task 04 (auth), task 02, task 06 (profile page it plugs follow buttons into).

## Known backend gaps — all fixed in task 06's backend pass

All three gaps originally flagged here were fixed together with task 06's backend work (same session, same pass, since they overlapped so directly): `FeedItemDto` now carries `username`/`displayName`/`avatarUrl` for the actor (`FeedController` batch-loads via `UserManager.Users.Where(u => actorIds.Contains(u.Id))`, no N+1); `GET /api/follows/followers/{userId}` and `GET /api/follows/following/{userId}` exist on `FollowsController`; `GET /api/users?query=` exists on the new `UsersController`. See task 06's Progress notes for the full detail on all of it, including the `bookOpenLibraryId` denormalization fix that this task's feed links also depend on.

## Progress

**Done.** `FollowButton` (built in task 06, used here too) and `FollowCounts` (followers/following counts on the profile page, each expandable into a `UserCard` list) cover follow/unfollow. `FeedPage` uses TanStack Query's `useInfiniteQuery` for cursor pagination (`before`/`beforeId`/`pageSize` → `nextCursor`/`nextCursorId`, matching `FeedPageResponse` exactly) with a "Load more" button; `FeedItemCard` renders actor name (links to their profile), a plain-language status ("wants to read" / "is reading" / "read" — `LOG_STATUS_LABELS` in the new `src/lib/logStatus.ts`, shared with `LogForm`'s status dropdown), book link/cover, rating, and review snippet. `PeoplePage` (route: `/people`, linked from the nav bar) mirrors `SearchPage`'s debounced-URL-synced search pattern exactly, over `searchUsers` instead of `searchBooks`.

Verified live via curl: registered a second user, followed them from the first user's token, confirmed `GET /api/follows/followers/{id}` and `GET /api/follows/following/{id}` both correct; logged a book as the second user and confirmed it appears in the first user's `GET /api/feed` with correct `username`/`bookOpenLibraryId`; confirmed `?pageSize=1` produces a real `nextCursor`/`nextCursorId` pair matching what `FeedPage`'s `getNextPageParam` expects. `npm run build` + `npm run lint` clean. Not yet visually confirmed in an actual browser (no browser tool this session).
