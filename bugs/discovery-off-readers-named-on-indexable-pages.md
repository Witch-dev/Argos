# Readers with "show me in discovery" off are still named on indexable book and author pages

**Priority:** P2 · **Size:** S · **Found:** 2026-11-02, `argos-security` review of the §6 privacy changes (`specs/search-engines.md`)

## What happens

Their own review and list pages are now `noindex` and out of the sitemap. But their public reviews still show on the book page (`GET /api/reviews?bookId=`, `ReviewsController.cs`) and their lists on book and author pages (`/api/books/{id}/lists`, `/api/authors/{id}/lists`, `BookListsController.cs`), with name, text and avatar. Those pages are indexable, because the reader's rating still counts toward the book, so Google can still read their name there.

## Fix

For signed-out callers only, leave out authors with `IsDiscoverable == false` in the review list (when `bookId` is set) and the two list queries, the same signed-out split as the comment rule. Add a test that `/api/reviews?bookId=` signed out doesn't contain a discovery-off reader's username. Phase 2's server-built book page ("newest 10 reviews", "up to 10 lists") must read from `CountingReviews()` / `CountingLists()` so it doesn't repeat this.

## Related, smaller

- A public account with discovery off that comments on a public review or list is still named: decision 1 only masks private accounts. Add `|| !IsDiscoverable` to the signed-out condition in `AnnotationCommentsController.EnrichAuthors` if that should change.
- A private account that accepted a collaborator invite on a public list is named, with avatar, in `GET /api/booklists/{id}` to signed-out visitors (`ListCollaborationService.cs`, `BookListDtoMapper.cs`).
