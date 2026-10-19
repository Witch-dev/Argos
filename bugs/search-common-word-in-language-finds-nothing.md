# Searching a common word in "My languages" finds nothing

**Priority:** P3 · **Size:** S · **Area:** Backend, search (Open Library) · **Found:** 2026-10-18 (shelf refresh Phase 4, ux-review of Search)

## What happens

`/search?q=the` with the default "My languages (English)" filter shows "Nothing in your languages for "the"." and offers "Search all languages". The same query with no language filter returns English books ("The Catcher in the Rye" first). Measured on the side-port API:

- `GET /api/books?query=the&language=eng` → `[]`
- `GET /api/books?query=the` → results, English titles included
- `GET /api/books?query=the%20hobbit&language=eng` → results

So a one-word stop-word query plus a language filter comes back empty from Open Library. Where that happens, the message blames the reader's languages, though the cause is the query.

## Fix

In `OpenLibraryClient` search: when a language-filtered query returns nothing and the query is one short common word, retry without the language filter and keep only results whose `titleLanguage` (or edition language) matches, or skip the filter for such queries. At the least, the empty message shouldn't say "in your languages" when the unfiltered search has results in those languages. Add a unit test with a stubbed Open Library response.

## Worked around

2026-10-18: Open Library returns nothing for a lone stop word with a language filter (`(the) AND language:eng`, and `the language:eng` too), and the local cache, which the unfiltered search also uses, has no language to filter by. So the Search page now says, for one word of three letters or fewer, that it is too short to search on its own and to add words (`search.filters.tryMoreWords`, five languages), instead of "Nothing in your languages". Test in `SearchPage.test.tsx`. Reopen if longer queries show the same.

Kept as is (user, 2026-10-18): the full fix would store each book's languages in the cache (Open Library's search results carry them), a migration and backfill for a search nobody makes on purpose.
