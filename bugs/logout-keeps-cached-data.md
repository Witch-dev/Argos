# Logout keeps the previous user's cached data

**Priority:** P1 · **Size:** M · **Area:** Frontend, auth · **Found:** 2026-10-05 (code review of `specs/feed-redesign.md` Phase 2) · **Status:** Fixed 2026-10-06 (`specs/app-hardening.md` Phase 2)

## What happens

On a shared computer, someone logs out and someone else logs in. For a moment the new person can see the previous person's Feed, Writings lists and other screens, including which items the previous person liked. The data is replaced once each screen fetches again (after about a minute, or when the page is reloaded).

## Why

The app keeps fetched data in a browser cache (React Query) so screens open instantly. Most cached lists aren't labelled with whose data they are: the Feed cache is just "the Feed", not "alice's Feed". `logout()` in `Apollon/web/src/auth/AuthContext.tsx` only removes the logged-in user's own record (`queryKeys.auth.me()`), so everything else stays and is shown to the next account.

This was already the case before the feed redesign; Phase 2 didn't cause it.

## How to reproduce

1. Log in as reader A and open the Feed.
2. Log out and, within a minute, log in as reader B in the same tab.
3. Open the Feed: A's items show briefly, with A's ♥ marks, before B's load.

## Suggested fix

Clear the whole cache on logout (`queryClient.clear()`) **and** make sure nothing refetches in between. The risk: screens still on the page would refetch without a login, get "401 unauthorized", and trigger logout again, which could loop. Two ways to avoid that:

- Navigate to the login page first, then clear the cache, so the protected screens are gone before anything refetches.
- Or clear the cache in `login()` too, right before the new user's data is fetched.

Add a test that logs out, logs in as someone else and checks that the old user's cached Feed is gone.

## Fixed (2026-10-06)

Fixed in `specs/app-hardening.md` Phase 2 (§3.4):
- `logout()` clears both tokens, then ends the session and navigates to `/login` in one React transition, then calls `queryClient.clear()`. The transition matters: without it, `ProtectedRoute` first redirected to `/login?next=<the previous reader's page>`.
- `login()` and `register()` clear the cache again before the new reader's data loads.
- Logging out in one tab logs out the others.

Tests in `Apollon/web/src/auth/AuthContext.test.tsx`: log out as A, log in as B, A's cached Feed is gone, and logout lands on plain `/login`.

One narrow case remains, accepted: a like or other update sent just before logout that finishes after the next reader has logged in can write the old data back into the cache.
