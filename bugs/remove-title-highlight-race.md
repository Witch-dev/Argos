# Removing a title can race with a new highlight-comment

**Priority:** P3 · **Size:** S · **Area:** Backend, writings · **Found:** 2026-10-05 (code and security review of `specs/feed-redesign.md` Phase 1) · **Status:** Open

## What happens

A note (a writing without a title) can't have highlight-comments, and removing a title is refused while a piece has any. But if, in the same split second, the author removes the title and another reader posts a highlight-comment, both can succeed. The result is a note that carries a highlight, which the rules say can't happen. The highlight would show in the comment data but not on the note's text.

Very unlikely in practice, and nothing leaks.

## Why

Both sides check, then save, as two separate steps with nothing tying them together:

- `WritingService.UpdateAsync` checks "are there highlight-comments?" then saves the title change.
- `CommentService.CreateAsync` checks "does the writing have a title?" then saves the highlight.

## Suggested fix

Either:

- Run both in a database transaction with a lock on the writing row (`SELECT … FOR UPDATE`), or
- After saving the title removal, check again; if a highlight appeared, put the title back and return the same 400 as before.
