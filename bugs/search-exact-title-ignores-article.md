# ✅ A search's "exact title" rule misses a title that starts with "The"

**Priority:** P3 · **Size:** S · **Area:** Backend, book search ranking · **Found:** 2026-10-25, Phase 3 browser check of `specs/book-data-in-reader-language.md`

## What happens

Searching **left hand of darkness** in English puts Le Guin's *The Left Hand of Darkness* (OL59800W) 4th. A self-published "Left Hand of Darkness" (Fatima Grace, 2021, listed twice) comes first, and *The Master and Margarita* comes 3rd as one of Open Library's loose matches.

## Why

`BookService.Rank` puts an exact title match before popularity. The query "left hand of darkness" equals "Left Hand of Darkness" exactly but not "The Left Hand of Darkness", so the one-edition book beats the novel that about 1,000 Open Library readers have shelved. This was already the case before Phase 3. Rank now compares the title that is shown, which doesn't change this case.

## Fix idea

Ignore a leading article when comparing (as `BookLocalizer.NameKey` does) and compare case-insensitively, so both count as exact matches and popularity decides. Add a unit test in `BookServiceTests`.

## Fixed (2026-10-25)

`BookLocalizer.SameName` compares titles without case, accents, punctuation, "&"/"and" or a leading article, and `BookService.Rank` uses it. A result also counts as exact when its original title matches (a Spanish reader typing "Norwegian Wood" finds *Tokio Blues*). Live: Le Guin's book is first for "left hand of darkness" in English and Spanish. Tests in `BookServiceTests` and `BookLocalizerTests`. Detail: `specs/book-data-in-reader-language.md` §11.
