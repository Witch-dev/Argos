# Feature Spec — Author pages: their own books vs books they're credited on

**Status:** built 2026-11-11. Asked by the user after finding Megan McDowell's page through Google: "this is an author right? but the books are not from that author."

Builds on `specs/authors.md` §4.2–4.4 (the works endpoint and grid).

## 1. What goes wrong today

Megan McDowell is a translator (Zambra, Donoso, Sara Mesa). Open Library lists her as a second **author** on 26 works, e.g. "Chilean Poet" → `author_key: [OL5086490A (Zambra), OL7345575A (McDowell)]`. The work record has no role: both entries are plain `/type/author_role` with no "translator" field (checked 2026-11-11 on `/works/OL24917854W.json`). So her author page shows "Most popular" and "All books" filled with other writers' books, with nothing saying whose they are. The same happens for any translator, editor, illustrator or foreword writer Open Library entered this way, which is common for translated fiction.

## 2. Decisions (2026-11-11)

1. **Rule of thumb: the first author listed is the book's author.** We can't read the role, but the first `author_key` is the writer in almost every case. On McDowell's page she is first on 1 of 26 works (and that one is a data error too). A work whose first author is this person (or that lists no keys) is **theirs**; any other is a book they're **credited on**.
2. **The author page splits the two.** "Most popular" and "All books" show only their own books. A new section **"Also credited on"** below lists the rest, each card showing the first author's name under the title, so the reader sees whose book it is. Same sort and "include books without a cover" choice as All books.
3. **Someone credited on more books than they wrote gets a line under their name:** "Mostly credited on other writers' books, for example as translator or editor." It doesn't claim a role the data doesn't give.
4. **The split needs the whole list, so it's done for authors with at most 200 works** (with the current cover filter, so an author with 150 works with covers but 250 in all is split until "include books without a cover" is ticked; accepted, it's rare). Asking Open Library for the whole list costs 4–14 KB and under a second for a translator or a typical writer, but 2 MB and 4 s for Shakespeare (measured 2026-11-11). Above 200 the page works as today (pages of 24 from Open Library, no "Also credited on"): such lists are writers with long careers, and a mis-split there matters little.
5. **Book pages are unchanged.** "Alejandro Zambra, Megan McDowell" stays as it is: real co-authors ("Good Omens": Pratchett, Gaiman) look exactly the same in the data, and demoting the second name would be wrong for them.
6. **Not changed:** new-release alerts for followed authors (`AuthorReleaseCheckService`) still count every work: someone who follows a translator wants their new translations. "Your history with this author" counts every book with them in it, so its "of N books" uses own + credited.

## 3. Design

### 3.1 API

- `OpenLibrarySearchResult.FirstAuthorKey`: the first `author_key` of the search doc (`author_key` added to the search fields).
- `GET /api/authors/{id}/works?sort=&all=&page=&credited=`: `credited=true` returns the books they're credited on; default their own. `AuthorWorksDto` gains `creditedTotal` (how many works list them after someone else; 0 when the list wasn't split).
- `AuthorService.GetWorksAsync`: asks for page 1 (24) as before. When Open Library's total is at most 24 that is the whole list; at most `SplitWorksLimit` (200), one more request for the whole list. The whole list is cached for an hour per (author, sort, cover filter) and split and paged in memory. Above 200, pages come from Open Library as before and `credited=true` answers an empty list. *Added after review:* if the whole-list request fails after the page worked, the page is shown unsplit and not cached (the next view tries again), instead of "Open Library is down"; a work whose first id is the id in the address (a merged author's old id that the search index still holds) counts as theirs too.

### 3.2 Author page

- `PopularShelf` and `AuthorWorks` unchanged apart from now getting own books only. *Changed in the critique round:* when the list was split, All books is headed "Books by {name}"; with none of their own it says "Open Library lists no books of {name}'s own here, only the ones below." instead of the "none with covers" message.
- `CreditedWorks`: heading "Also credited on", a one-line intro "Books by other writers where Open Library also lists {name}, for example as translator or editor.", the count, a grid with "Show more", the first author's name in each card's detail (at most two lines, full name in `title`). Hidden when `creditedTotal` is 0; only asked for when the own list says there are some. Both lists keep their last answer while a new sort loads, so the section doesn't fold and come back.
- Header line (decision 3) from the Popular covers-only first page: shown when `creditedTotal > total`.

## 4. Tasks

### Backend

- [x] `author_key` in the search fields, `FirstAuthorKey` on results.
- [x] `AuthorService.GetWorksAsync` split and in-memory paging (§3.1); controller `credited` param and `CreditedTotal`.
- [x] Tests (`AuthorTests`, `OpenLibraryAuthorTests`): split by first author, a work with no keys counts as theirs, paging both lists, a short list asked for once, a list over 200 isn't split and `credited=true` there is empty, both lists from one request, a failed whole list falls back to the page and is tried again.

### Frontend

- [x] `getAuthorWorks` `credited` option, `creditedTotal` type, query key.
- [x] `CreditedWorks` section, header line, All books heading and empty state, history total (§3.2, decision 6).
- [x] Translations in all five languages (`authors.credited.*`, `authors.works.headingBy`, `authors.works.noneOwn`).
- [x] Tests in `AuthorPage.test.tsx`: the section with bylines and the header line, nothing asked or shown without credited books, the own-books message.

### Verification

- [x] Author tests on a private DB (74/74; the full suite runs in the push precheck), `npm test` (1458/1458 before the review fixes; author page and locales re-run after), `npm run lint`, `npm run build`.
- [x] Browser check and screenshots of a translator's page (OL7345575A: 1 own book, 10 credited with covers, the header line) and a writer's (OL5086490A: 32 own, 4 credited, no header line), Paper and Dark at 1280 and 375; two design-critique rounds (fixes: header line matches the years line, "Books by {name}", byline at most two lines, shorter intro).
- [x] Reviewer, 2026-11-11: no bug on the main paths. Fixed: whole-list failure fallback, merged old id, section flicker on sort change, message for no own books. Accepted: a cold page past 1 costs one extra request; on a cold cache the default view makes 2 requests (Popular and All books share a key; the credited list waits for the own list, so it hits the cache); the club book picker shows only the author's own books.
