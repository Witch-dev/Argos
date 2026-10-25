# A profile keeps going back to "Loading" when one of the rows above its shelves fails

**Priority:** P2 · **Size:** S · **Area:** Frontend, profile page
**Found:** 2026-10-25, writing tests for specs/shareable-pages.md Phase 2.

## What happens

`ProfilePage` waits for three requests before it shows the page (the goal line, favourite books, favourite authors: `waitingAbove`, so the shelves don't slide down as they arrive, ux-reviews/profile.md #1). The comment says "a failed one just stops the wait". It doesn't, quite:

1. One of them fails (say `GET /users/x/favourites` answers 500).
2. The wait ends and the page renders, mounting `FavouriteBooksRow`, which uses the same query.
3. A component mounting on a query in the error state refetches it, and React Query reports it as `pending` again while it does.
4. `waitingAbove` is true again, so the page shows `LoadingMessage` and unmounts the row. The refetch fails, and the cycle repeats from step 2.

The result is a profile that flickers between the page and "Loading" and keeps sending the failing request. In tests, rejected mocks keep the page on "Loading" (ProfilePage.test.tsx resolves them with empty data instead).

## Fix

Wait only for the first answer: track it in a ref or state ("each above-shelf query has settled once") so a later refetch doesn't hide the page again. Or set `retryOnMount: false` on the three row queries. Add a test with a rejected `getFavourites` that expects the shelves to show.
