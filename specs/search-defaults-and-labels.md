# Feature Spec — Search defaults and labels

**Status:** ✅ Implemented 2026-10-14; browser check still to do (needs an API restart)

## 1. Problem

Searching "do androids dream of electric sheep" showed eight cards: the novel, three graphic-novel volumes, an Italian and a Spanish translation, a movie tie-in, all looking alike. Open Library keeps a separate *work* per translation and adaptation and never merges them, and merging by hand is a librarian job Argos has no team for. So instead of merging we make the list easier to read.

## 2. Design

- **Popularity ranks the default search.** `BookService.Rank` now orders by: reader's alphabet → exact title → **most shelved on Open Library** (`readinglog_count`) → has a cover. Open Library's relevance still orders ties (stable sort). On the check above the novel has 1,042 shelvings and the rest 24 or fewer. A cached book with no live count counts as 0.
- **Labels on the card.**
  - *Language:* a work whose editions are all in one language that isn't English gets "Italian edition" (`TitleLanguage` now also covers Latin-alphabet titles; the code is Open Library's three-letter one). English, `und`, `mul`, `zxx` and works with several languages get nothing. The site never shows the reader's own language.
  - *Graphic novel:* `subject` is added to the search fields; a subject containing "graphic novel" or "comic book", or exactly "comics" / "comic strips", sets `IsGraphicNovel` (not stored). "Comic fiction" (humour) does not count. Works with no subjects (the Omnibus) get no label.
- **Language filter defaults to "my languages".** With no `lang` in the URL the search covers the reader's interface language plus English (`readerLanguages`: es→spa, pt-BR→por, de→ger, fr→fre). The select's first option is "My languages (English, Español)", the second "Any language" (`lang=all`), then the 14 single languages. The API's `language` takes up to three comma-separated codes (`spa,eng`, sent as `language:(spa OR eng)`). The filter matches works with an edition in any of them, so the novel stays and Italian-only entries go.
- **No dead end.** If the default finds nothing, the page says "Nothing in your languages for …" with a "Search all languages" button.
- **Not changed:** the top-bar suggestions use the plain search with no language filter; "Clear filters" returns to "my languages".

## 3. Not done

- Merging duplicate works (a human job; see `FUTURE-IDEAS.md`).
- A graphic-novel label for works with no subjects at all, and a "movie tie-in" label.
- Remembering a reader's chosen languages across searches (the URL carries it).

## 4. Tasks

### Backend
- [x] `subject` field, `IsGraphicNovel`, Latin-title language, several language codes in `BuildQuery` and the controller
- [x] Popularity in `BookService.Rank` (and the later-page path); one `ToBook` mapper replaces three copies
- [x] Unit tests (`SearchTextHelperTests`, `BookServiceTests`) and a 400 case for four codes

### Frontend
- [x] `readerLanguages`, `lang=all`, "My languages" select, fallback button (`SearchPage`)
- [x] "Graphic novel" tag in `BookCard`; `TitleLanguageNote` hides the reader's own language
- [x] `search.filters.myLanguages|noneInYourLanguages|searchAllLanguages`, `books.graphicNovel` in 5 languages
- [x] Tests: `SearchPage.test.tsx`, `BookCard.test.tsx`

### Verification
- [x] 439 backend unit tests, frontend tests for the touched files, `npm run build`, `npm run lint`
- [x] Open Library spot check for the Androids search (fields and values above)
- [ ] Look at the Androids and Silmarillion searches in the browser after an API restart
