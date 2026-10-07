# An old username only redirects on the profile page

**Priority:** P3 · **Size:** S · **Area:** Backend + frontend, accounts · **Found:** 2026-10-07 (code review of `specs/account-system.md` Phase 3) · **Status:** Open

## What happens

After a reader changes their username, their old profile address (`/u/oldname`) opens their profile for 30 days. Other addresses with the old name don't: `/u/oldname/compare` shows "not found", and so do API calls such as `/api/users/oldname/favourites` or `/match`.

The spec only promised the profile page, so this is a gap rather than a broken promise. It matters for links people shared, e.g. a "compare our reading" link.

## Why

Only `UsersController.GetByUsername` falls back to `UsernameAvailability.FindRecentHolderAsync`. The other username routes call `FindByNameAsync` directly.

## Suggested fix

One helper, "find a reader by current or recently held username", used by every `{username}` route, and on the frontend the compare page replacing its address the way the profile page does.
