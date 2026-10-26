# Open Library refuses connections from production, and search says "nothing found"

**Priority:** P1 · **Size:** M–L · **Status:** code fixed 2026-10-25, block still open · **Area:** Backend, Open Library client, refresh job, search · **Found:** 2026-10-25, a Spanish search for "la mano izquierda" on the live site

## What happens

Since Oct 25, 2026, 8:15 PM (UTC−3), every request from the production API to `openlibrary.org` fails with `System.Net.Http.HttpRequestException: Connection refused (openlibrary.org:443)`. Searches, author searches and books not cached yet all fail:
- A search with a language filter shows "Nada en tus idiomas para «la mano izquierda»".
- Without the filter, only books already stored here come back ("dune" gives just one result).
- *Harry Potter and the Philosopher's Stone* (OL82563W) answers "not found".

The same requests, with production's exact User-Agent, work from a home connection and from the side-port API.

## Why

**The refusal:** Open Library refuses TCP connections from our outgoing addresses, Render's shared ranges `74.220.49.0/24` and `74.220.57.0/24`. Two possible causes:
- **Our own burst.** The Phase 1 backfill of `specs/book-data-in-reader-language.md` first reached production in the 2026-10-25 deploy (Apollon `38cbc12`, live about 6:15 PM). It starts as soon as the API starts, takes up to 500 books per run, and fetches up to 500 editions per book plus Wikidata calls. The free plan restarts the API after every sleep, so the run started again on each wake. The refusals began about two hours after the deploy.
- **A neighbour's traffic.** Render shares those ranges with other customers, so another service's traffic could have caused it.

**The misleading message:** when Open Library can't be reached, `OpenLibraryClient` returns null. Search then answers 200 with only the stored books (none at all with a language filter), so the page can't tell "Open Library is down" from "no such book".

## Done so far

- `CacheRefresh__MaxLocalizationsPerRun` = `0` set on `wingedwords-api` in Render (backfill off; the book page still builds a book's rows when it's opened).
- Email sent to openlibrary@archive.org on 2026-10-25, asking whether the ranges are blocked and offering to keep to their preferred rate or use a dedicated address.

## Fixed in the code (2026-10-25)

Both parts of the fix idea's points 1 and 2 are built:
- **Search:** the API answers `{ books, openLibraryUnavailable }`. When Open Library can't be reached, the search page says "Open Library isn't answering right now, so these are only the books saved here" (or that nothing saved matches), in five languages. A filtered or sorted search then shows the stored books that match, with the years applied. The language filter can't be applied, since stored books don't know their editions' languages. Header suggestions, pickers and import still get only the books.
- **Refresh job:** batched as planned. Search returns the matched edition's cover (`editions.cover_i`), so covers need no extra request. There is a 10-minute start delay, and the run stops at the first refusal. The book page reads 100 editions. Detail, rule changes and review fixes: `specs/book-data-in-reader-language.md` §13.

**Still open:** the block itself. Waiting on the email to Open Library; point 3 below if they won't lift it. After this deploy, set `CacheRefresh__MaxLocalizationsPerRun` back on in Render (delete it to get 500, or start lower, e.g. 100) and watch the first run's log for "Book language build".

## Fix idea

1. **Backfill: ask Open Library in batches instead of per book** (agreed 2026-10-25):
   - **Titles from a batched search.** One request covers up to 100 books: `search.json?q=key:(/works/A OR /works/B …)&lang=<xx>` with the fields `key,title,language,editions,editions.key,editions.title,editions.language`, as `OpenLibraryClient.GetSearchEditionTitlesAsync` already does for Phase 3. Open Library returns one edition per work, preferring the language. About 5 requests per language for 500 books, and roughly 20 in total, since English rarely needs one. Today it's 500 requests of up to 500 editions (≈1 MB) each.
   - **Skip languages with nothing to find.** The work's `language` field lists the languages it has editions in.
   - **The title rule changes for these books.** The Wikidata label still comes first (§3.1). Otherwise the one matched edition's title is used, cleaned as today, instead of the most common one among the language's editions. Note it in the spec.
   - **Descriptions:** one small `/books/{edition}.json` request for that matched edition, only when the language still has no description after Wikipedia.
   - **Covers:** check whether search can return the matched edition's cover (`editions.cover_i`). If it can't, the cover comes from that same edition request.
   - **Batch Wikidata too:** `wbgetentities` takes up to 50 ids per request.
   - **The book page** (one reader, one book) keeps the editions list, but asks for 100 instead of 500, like the cover picker.
   - **Pacing:** wait some minutes after startup before running, and stop the whole run on the first refused, 429 or 5xx answer. Then set `CacheRefresh__MaxLocalizationsPerRun` back on Render.
2. **Search:**
   - Report "Open Library unreachable" separately from "no results". The API returns a flag or status, and the page says "Open Library isn't answering right now, showing books saved here" (five languages).
   - Keep stored books in the results when a language filter is set.
3. **If Open Library won't unblock a shared range:**
   - A dedicated outgoing IP (Render add-on, after the paid plan; first confirm it's outside the blocked ranges), or the API or a small relay on a host with its own address. Only if the block was on the shared range, not on Winged Words itself.
   - Longer term: load Open Library's monthly data dumps into our database so search doesn't depend on their API.
