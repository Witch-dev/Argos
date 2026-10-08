# Import trusts Open Library work keys and cached ISBNs forever

**Priority:** P3 · **Size:** S · **Area:** Backend, imports, Open Library · **Found:** 2026-10-08 (argos-security review of `specs/book-import.md` Phase 3) · **Status:** Fixed 2026-10-08

## What happens

- A crafted CSV alone can't redirect other readers' imports (only the ISBN Open Library itself confirmed is remembered). But Open Library is a public wiki: if an edition's `works` key is vandalised while someone imports that ISBN, the wrong mapping is pinned in `Books.Isbns` and later importers get it as a sure ISBN match, with no "Check these" step.
- `BookRepository.GetByIsbnAsync` is `FirstOrDefault` without an order, so it is unpredictable if two works ever share an ISBN.
- The work key from Open Library isn't checked against `^OL\d+W$` (`OpenLibraryClient.cs` ~line 137) before use in a URL and as `Book.OpenLibraryId`. Requests stay on openlibrary.org, so no SSRF.

## Suggested fix

Validate the key; consider ignoring cached ISBN matches older than N days, or sending a row to "Check these" when the ISBN's work differs from the title match. Also order `GetByIsbnAsync`.

## Fix (2026-10-08, Apollon bdf575f)

- An ISBN match, cached or fresh, is trusted only if the book's title **or** author agrees with the row. When both differ the row goes to "Check these" (`MatchKind.ByIsbnUnsure`) and the ISBN isn't remembered, so a vandalised record can't become a sure match for later readers. Chosen over expiring cached ISBNs after N days: it catches a bad record on first use and needs no extra Open Library calls.
- `FindWorkIdByIsbnAsync` rejects work keys not shaped like `OL<digits>W`.
- `GetByIsbnAsync` is ordered by id.
- The "Check these" hint no longer says "matched by title only".

**Follow-up after the review and security review (same day):** a cached ISBN that disagrees is no longer used straight away: the row's other ISBN and the title search come first. An ISBN is remembered only when title **and** author agree (one alone could be crafted in the file). A row with no author no longer agrees with any book by default. Work-id patterns use `\z` and `[0-9]`, so a trailing newline can't slip through.
