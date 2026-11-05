# Changing a writing's language marks it "edited"

**Priority:** P3 · **Size:** S · **Area:** Backend · **Found:** 2026-11-05 (browser-check and review of `specs/content-language.md` Phase 3) · **Status:** Open

## What happens

On a writing you posted, "Change" (language) saves through the normal update endpoint. `WritingService.UpdateAsync` always sets `IsEdited = true` and `UpdatedAt = now`, so the writing then shows the "(edited)" tag although only its label changed. Reviews are not affected: their edited marker only moves when the text changes.

## Suggested fix

In `WritingService.UpdateAsync`, leave `IsEdited` and `UpdatedAt` alone when the title and content are unchanged (only the language differs). Add an integration test next to the language tests.
