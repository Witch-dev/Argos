# Import trusts Open Library work keys and cached ISBNs forever

**Priority:** P3 · **Size:** S · **Area:** Backend, imports, Open Library · **Found:** 2026-10-08 (argos-security review of `specs/book-import.md` Phase 3) · **Status:** Open

## What happens

- A crafted CSV alone can't redirect other readers' imports (only the ISBN Open Library itself confirmed is remembered). But Open Library is a public wiki: if an edition's `works` key is vandalised while someone imports that ISBN, the wrong mapping is pinned in `Books.Isbns` and later importers get it as a sure ISBN match, with no "Check these" step.
- `BookRepository.GetByIsbnAsync` is `FirstOrDefault` without an order, so it is unpredictable if two works ever share an ISBN.
- The work key from Open Library isn't checked against `^OL\d+W$` (`OpenLibraryClient.cs` ~line 137) before use in a URL and as `Book.OpenLibraryId`. Requests stay on openlibrary.org, so no SSRF.

## Suggested fix

Validate the key; consider ignoring cached ISBN matches older than N days, or sending a row to "Check these" when the ISBN's work differs from the title match. Also order `GetByIsbnAsync`.
