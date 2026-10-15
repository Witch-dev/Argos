# Feature Spec — Book picker search

**Status:** ✅ Implemented 2026-10-15; browser check still to do

## 1. Problem

Starting a book in reading progress (and suggesting a book to a club, attaching one to a writing, adding one to a list) used a stripped-down search: title and cover only, one page of results, no author, no labels. A book that wasn't in the first handful could not be found.

## 2. Design

- **One result row** (`BookResultSummary`): cover, title, "Author · year", and the "Graphic novel" / "Italian edition" labels the search page shows. Used by `BookPicker` and `AddBookSearch`.
- **Same paging as the search page** (`usePagedBookSearch`): 20 a page, "Show more results" up to the server's 10 pages, duplicates across pages dropped.
- **Reader's languages first**, like the search page (interface language plus English). With no results there: "Nothing in your languages for …" and a "Search all languages" button.
- **Author search** needs no backend change: the query goes to Open Library unchanged, so "Tolkien Silmarillion" matches on author. A hint under the box says "Search by title or author."
- **Escape hatch:** "Can't find it? See all results" links to `/search?q=…` (with `lang=all` if the reader already lifted the language filter).
  - **From the progress dialog it comes back.** The link adds `pick=progress&returnTo=<current page>`. In that "pick mode" the search page shows a banner with Cancel, and a card chooses the book instead of opening its page: it navigates to `returnTo` with router state `{ pickedBook: <Open Library id> }`. `AddProgressTile` reads that state on arrival, clears it, and opens `ProgressUpdateModal` on "start a new book" with the book fetched and chosen (`initialBookOpenLibraryId`). `returnTo` is followed only if it starts with `/` and not `//`. Clearing filters keeps pick mode; the nav-bar search box leaves it.
  - **The other pickers** (writing, club suggestion, list add) get a plain link to the search page: they have no way back.
- The results box is taller (12rem → 20rem).

## 3. Not done

- Sort, era and language selects inside the picker (the full search page has them).
- A way back for the writing, club-suggestion and list-add pickers.

## 4. Tasks

### Frontend
- [x] `BookResultSummary`, `usePagedBookSearch`
- [x] `BookPicker` and `AddBookSearch`: paging, languages, fallback, see-all link
- [x] Pick mode: `SearchPage` (`pick`, `returnTo`), `BookCard` `onPick`, `AddProgressTile` and `ProgressUpdateModal` `initialBookOpenLibraryId`
- [x] `bookPicker.hint`, `bookPicker.seeAllResults`, `search.pickBanner` in 5 languages
- [x] Tests: `BookPicker.test.tsx`, `AddBookSearch.test.tsx`, `SearchPage.test.tsx` (pick mode), `ProgressUpdateModal.test.tsx`; router added to `WritingComposerModal.test.tsx`

### Verification
- [x] Full Vitest run, `npm run build`, `npm run lint`
- [ ] In the browser: "+" progress tile → start a new book → search an author + title, Show more, See all results (pick a book there, land back in the dialog with it chosen)
