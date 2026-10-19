# The rail's club card shows the next checkpoint a day early west of UTC

**Priority:** P2 · **Size:** S · **Area:** Frontend, clubs · **Found:** 2026-10-18 (shelf refresh Phase 4, ux-review of Clubs)

## What happens

The right rail's "My Book Clubs" says "Next checkpoint Nov 14" while the Clubs directory and the club's page say "Due Nov 15" for the same checkpoint. Checkpoint due dates are stored as midnight UTC; the club pages format them with `timeZone: 'UTC'` (fixed in Phase 3), but `MyClubsCard.tsx` (around line 49) calls `formatDate` without it, so the date shows in local time, a day early anywhere west of Greenwich (the Windows machine here is UTC−6).

## Fix

Pass `timeZone: 'UTC'` in `MyClubsCard`, as `CheckpointRowLink` and the directory card do (or move a `dueDate()` helper next to `shortDate` in `journalShelfBook.tsx` and use it everywhere a checkpoint date shows). Grep the other rail cards for `formatDate` on day-only dates. Add a test with a midnight-UTC date and a negative-offset `TZ`.

## Fixed

2026-10-18: `MyClubsCard` formats the due date with `timeZone: 'UTC'`; its test pins Nov 1 for a midnight-UTC date (it catches the bug on a machine west of UTC, as this one is). Checked on screen: the rail and the club both say Nov 15.
