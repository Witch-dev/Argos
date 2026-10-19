# Two account erasures at once can both try to create the "Deleted user" placeholder

**Priority:** P2 · **Size:** S · **Area:** Backend, account deletion, tests · **Found:** 2026-10-19 (full test run while building `specs/invite-requests.md` Phase 1) · **Status:** Open

## What happens

`AccountErasureRepository.EnsureDeletedUserAsync` (Apollon `src/Argos.Infrastructure/Repositories/AccountErasureRepository.cs`, around line 215) checks whether the shared "Deleted user" account exists and, if not, inserts it. Two erasures running at the same moment can both see "missing" and both insert. The second fails with a unique violation on `PK_AspNetUsers`, and that erasure fails.

Seen once in three full runs: `FavouriteAuthorTests.ExportAndErasure_CoverFavouriteAuthors` failed with `23505 … PK_AspNetUsers` from `EnsureDeletedUserAsync`. Test classes run in parallel and several of them erase accounts, so it's a flaky test today. In production erasures run one at a time from `AccountErasureWorker`, so it is unlikely there, but any second path to erasure would hit it.

## Suggested fix

Insert the placeholder with `INSERT … ON CONFLICT ("Id") DO NOTHING`, or catch the unique violation and carry on (the row the other erasure created is the one wanted). Alternatively, create it once in a migration or at startup.
