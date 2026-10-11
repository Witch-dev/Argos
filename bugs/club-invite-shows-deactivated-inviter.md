# Pending club invites still show a deactivated inviter's name

**Priority:** P3 · **Size:** S · **Area:** Backend, clubs · **Found:** 2026-10-11 (security review of Stage 6)

## What happens

A reader who asked to delete their account is hidden everywhere, but a pending club invitation they sent still shows their username as the inviter (`ClubInviteService` around lines 77–79 reads inviter names through `UserManager.Users`, which isn't filtered).

## Why it's small

The invitee already knows who invited them, the name is a public username, and the account is erased after 30 days anyway (the invitation goes with it).

## Fix

Show a neutral label, or hide the invite, while the inviter has `DeactivatedAt` set. Add a test next to `ClubInviteAndReadersTests`.
