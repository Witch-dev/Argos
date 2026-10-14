# Feature Spec — Clearer Book Search Results

**Status:** ✅ Implemented (2026-10-14)

## 1. Problem

Searching "white nights" showed the same book three times: one with no cover, one with the author in Cyrillic ("Фёдор Михайлович Достоевский"), one titled "Белые ночи". Open Library keeps a separate *work* per language and publisher and never merges them, and each carries whatever the cataloguer typed. Argos passed all of it through in Open Library's order.

## 2. Design

All of this is for **live search results**; no schema change (`Book.TitleLanguage` is `[NotMapped]`).

- **Ranking** (`BookService.Rank`, stable sort so Open Library's relevance still orders each group): results in the alphabet the reader typed first (title and author both count), then an exact title match, then results with a cover.
- **Latin author names** (`SearchTextHelper.LatinAuthors`): when a work has one author written in a non-Latin script, use the Latin spelling most of Open Library's `author_alternative_name` spellings agree on (word frequency, so a typo never wins). Several authors, or no usable alternate, leave the names unchanged, because the alternates list is flat and can't be matched to an author.
- **Language note** (`SearchTextHelper.TitleLanguage`): a title in a non-Latin alphabet gets a two-letter language from the first of the work's edition languages written in that alphabet. The site shows it as "Russian edition" (`TitleLanguageNote`, key `books.languageEdition`) in `BookCard` and the import "Find the book" dialog. No match means no note, because a wrong label is worse than none.
- The cover placeholder (title on a grey card) is unchanged.

## 3. Not done

- Collapsing the same title into one result (can hide genuinely different books).
- Cached books don't get a language note and keep the author names they were saved with; the book page's own author names still come from the work's author record.
- Ranking by the reader's UI language rather than the query's alphabet.

## 4. Tasks

### Backend
- [x] Ask Open Library for `author_alternative_name` and `language`
- [x] `SearchTextHelper` (alphabet, Latin author, title language) + `BookService.Rank`
- [x] `TitleLanguage` on `BookDto`
- [x] Unit tests: `SearchTextHelperTests`, ranking test in `BookServiceTests`

### Frontend
- [x] `TitleLanguageNote` in `BookCard` and `FindBookDialog`; `books.languageEdition` in 5 languages
- [x] `BookCard.test.tsx`

### Verification
- [x] Backend unit tests, `npm test` for the touched files, `npm run build`, `npm run lint`
- [ ] Look at "white nights" in the browser after an API restart
