# A book saved in the week before ratings shipped waits a week for its Open Library rating

**Priority:** P2 · **Size:** S · **Area:** Backend, Open Library refresh · **Found:** 2026-10-19 (checking `specs/open-library-ratings.md` locally) · **Status:** Fixed 2026-10-25

## What happens

The refresh job's backfill (`BookRepository.GetStaleBooksAsync`) only fetches a missing Open Library rating for books cached more than a week ago (`RatingRetryAfter`). The wait is there so a fetch that *failed* isn't retried every day. But a null `OpenLibraryRatingCount` means both "never tried" and "tried and failed", so a book cached shortly before ratings shipped also waits.

Seen in the dev database: The Left Hand of Darkness (`OL59800W`, cached 2026-10-16) shows no Open Library rating, though Open Library has 4.27 from 56. 70 of its 80 books were waiting like this. In production, every book cached in the week before the deploy waits up to a week.

## Suggested fix

Add `OpenLibraryRatingCheckedAt` (nullable timestamp) to `Books`, set on every rating fetch attempt:

- null: never tried, so the next refresh run fetches it (runs right after the API starts);
- set and count null: tried and failed, so retry once it is over a week old (today's rule).

A second migration, the two conditions in `GetStaleBooksAsync` and `FakeBookRepository`, and tests in `OpenLibraryCacheRefreshServiceTests` and `AuthorTests` (`StaleBooks_IncludeOnesWhoseRatingWasNeverFetched`). Update `specs/open-library-ratings.md` §3.3 and SPEC.md §7.

**Quick workaround for one book in dev:** set its `CachedAt` back more than a week and restart the API.

## Fixed

2026-10-25, as suggested: `Books.OpenLibraryRatingCheckedAt` (migration `OpenLibraryRatingCheckedAt`), stamped on every fetch attempt. Never asked → the next refresh run fetches it; asked and failed → retried after a day (was a week from `CachedAt`). Found again in production on Lord of the Flies (`OL455327W`): 1 rating here, 3.7 from 404 on Open Library, no stand-in shown, most likely because its first fetch timed out. Tests: `OpenLibraryCacheRefreshServiceTests`, `AuthorTests.StaleBooks_IncludeOnesWhoseRatingWasNeverFetched`, `OpenLibraryRatingsTests`. Detail in `specs/open-library-ratings.md` §3.3.
