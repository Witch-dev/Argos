# The data export says nothing about a reader's clubs

**Priority:** P3 · **Size:** S · **Area:** Backend, export, privacy · **Found:** 2026-10-23 (security review of `specs/stronger-clubs.md` Phase 1) · **Status:** Open

## What happens

"Download my data" (`AccountExportWriter`) has `club-messages.csv` but no list of the reader's clubs. Since Phase 1 of `specs/stronger-clubs.md`, a club can also keep a ban about a reader (a `Banned` membership with its date), and the privacy policy now says so ("If a club bans you, it keeps that you were banned and when"). A banned reader can't see that anywhere except the "You can't join this club" message.

## Why it matters

The export is how readers see the data kept about them (GDPR access). Club memberships were never in it, so this predates the ban, but the ban makes it more personal.

## Fix

Add `clubs.csv`: club name, status (Member / Moderator / Admin, Invited, Asked to join, Banned) and its date, from `AccountExportRepository`. Leave out `BannedByUserId`, so the export never names the moderator who did it. Also list the buddy-read posts the reader opened with "Show anyway" (`CheckpointCommentUnlocks`, added in Phase 5: club, when; not the post's text), noted by the Phase 5 security review. Update the privacy policy's "Downloading your data" list and the export test.
