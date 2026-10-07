# Deleting a writing isn't one transaction

**Priority:** P3 · **Size:** S · **Area:** Backend, writings · **Found:** 2026-10-05 (code review of `specs/feed-redesign.md` Phase 1) · **Status:** Open

## What happens

Deleting a writing is two separate database steps: delete the writing, then delete its comments. If the second step fails (for example the database connection drops between them), the writing is gone but its comments stay in the database, pointing at nothing. Nobody sees them, so users aren't affected; they're just leftover rows.

The order was chosen on purpose (writing first) so that a failure can never do the worse thing: leave a writing with all its comments deleted.

## Why

`WritingService.DeleteAsync` (`Apollon/src/Argos.Api/Services/WritingService.cs`) calls `IWritingRepository.DeleteAsync` and then `ICommentRepository.DeleteByTargetAsync`, and each one saves on its own. Comments point at their writing by id rather than a real foreign key (a deliberate design choice in `specs/writings-and-annotations.md` §3.2), so the database doesn't remove them automatically.

## Suggested fix

Wrap both steps in one database transaction (`dbContext.Database.BeginTransactionAsync()`), for example with a small repository method that deletes a writing and its comments together. Lists (`BookListService` delete) have the same two-step pattern and could get the same fix.
