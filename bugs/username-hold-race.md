# A sign-up racing a rename can take the name being given up

**Priority:** P3 · **Size:** S · **Area:** Backend, accounts · **Found:** 2026-10-07 (security review of `specs/account-system.md` Phase 3) · **Status:** Open

## What happens

When a reader renames themselves, their old username is held for 30 days so nobody else can take it. But if someone signs up with that exact name in the same few milliseconds as the rename is saved, the sign-up can get it:

1. The sign-up checks the hold. The rename isn't saved yet, so the old name isn't held; it's in use, which Identity checks later.
2. The rename saves the new name and the hold together.
3. The sign-up saves. Identity's "already in use" check finds nobody using the name now, so it succeeds.

The window is milliseconds and the attacker would need to know the rename is happening at that instant, so it's very unlikely.

## Why

The hold lives in `UsernameHistory`, while the database's unique index only covers names in `AspNetUsers`. Nothing in the database ties the two together.

## Suggested fix

After a sign-up (or rename) saves, check the hold again; if the name turns out to be held by someone else, undo it and answer "taken". Or check the hold inside a transaction that locks the matching `UsernameHistory` rows.
