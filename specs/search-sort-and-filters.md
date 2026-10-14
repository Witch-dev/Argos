# Feature Spec — Search: sort and filters

**Status:** ✅ Implemented and checked in a browser (2026-10-14)

## 1. Problem

The search page returned one list in one order. Readers wanted the usual controls: best match, most popular, newest or oldest, and filtering by language and by when a book was published.

## 2. Design

- **Controls** under the search box (shown once there is a query), all kept in the URL (`sort`, `lang`, `era`) so a search can be shared and survives a refresh: Sort by (Best match, Most popular, Highest rated, Newest first, Oldest first), Language (14 common Open Library languages, named in the reader's UI language), Published (Before 1900, 1900–1949, 1950–1999, 2000–2009, 2010 and later) and "Clear filters".
- **API:** `GET /api/books?query=&sort=&language=&fromYear=&toYear=`. `sort` is one of `BestMatch|MostPopular|HighestRated|Newest|Oldest`, `language` a three-letter code, years 1–2100 with from ≤ to. Anything else is a 400, because these values go into the Open Library query.
- **Language and years run inside Open Library** (`(words) AND language:spa AND first_publish_year:[1950 TO 1999]`), so they are exact. Language matches works with an edition in that language.
- **Sorting is ours, on the 60 best matches.** Open Library's own sort runs over every loose match: "white nights" sorted by date lists books about neither first. We fetch the 60 most relevant works, order them, and return 20 (`BookService.SearchWithOptionsAsync`). Most popular = Open Library readers who shelved the work; Highest rated = average pulled toward 3.5 until a work has ~10 ratings (one 5-star vote doesn't win); Newest/Oldest put undated and year-0 works last.
- **Any sort or filter skips the local cache** (cached rows have no language and Open Library knows every cached work). The default search is unchanged.
- The result alphabet ranking from `specs/search-result-clarity.md` still applies inside each order.

- **Show more** (added the same day): the page shows 20 books and a "Show more results" button loads the next 20, up to 10 pages (`page` on the API). A plain search takes Open Library's next results by offset (cache not mixed in; the site drops a repeated book). A sorted or filtered search pages through the sorted pool, now the 100 best matches, so it ends after at most 5 pages.

- **Suggestions under the top-bar search** (added the same day, `HeaderSearch`): from two letters, after a 250 ms pause, up to six matching books appear under the box with cover, title, author and year, and a last row "See all results". Arrow keys move, Enter opens the highlighted book (or the full results with nothing highlighted), Escape and a click outside close it. It reuses the plain search (cache first, then Open Library). On a phone the list spans the screen. It is a `combobox`/`listbox` for screen readers.

## 3. Not done

- Open Library sometimes returns a work whose shown first-publication year is outside the chosen era (seen once: 1713 under 1950–1999); its filter and its returned year can disagree.
- Free-form year range, a "has a cover" filter, and sort by title.

## 4. Tasks

### Backend
- [x] `BookSearchOptions`, Open Library query building, ratings/readinglog fields
- [x] Sort/filter in `BookService`, validation in `BooksController`
- [x] Unit tests (sorts, cache skipped, query building) and controller 400 tests

### Frontend
- [x] Sort / Language / Published selects on `SearchPage`, `search.filters.*` in 5 languages
- [x] Tests for the page

### Verification
- [x] Backend tests, `npm run build`, `npm run lint`, page tests
- [x] Browser check (Playwright, desktop and 375px): suggestions, keyboard, Show more (no repeats), each sort, language + era filters, clear filters
