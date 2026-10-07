# On a phone, a book's subject tags push "Log this book" far down the page

**Priority:** P3 · **Size:** S · **Area:** Frontend, book page · **Found:** 2026-10-06 (browser click-through, `ROADMAP.md` Stage 0) · **Status:** Fixed 2026-10-06

## What happens

`Apollon/web/src/pages/BookDetailPage.tsx` shows every subject Open Library has for a book as a chip, before the **Log this book**, **Add to a list** and **Favourite** buttons. Some books have a lot of them: Dracula (`OL85892W`) has about 60, including near-duplicates ("Fiction, horror", "Horror fiction", "Horror tales") and catalogue codes ("nyt:mass-market-monthly=2021-11-07", "award:hugo_award=1966").

At desktop width the chips sit beside the cover and take a few lines. At phone width (390 px) they fill about two screens, so the main action on the page, logging the book, is far down where most readers won't scroll.

## Why

The page renders `book.subjects` in full, with no limit and no filtering.

## Suggested fix

- Show the first 8 or so subjects, plus a "Show all (60)" button that reveals the rest.
- Optionally drop the catalogue-style ones (anything containing `:` or `=`, like `nyt:…` and `award:…`), which aren't useful to readers.
- Optionally move the action buttons above the subjects at phone width.

This fits Roadmap **Stage 3** ("the five screens people use most work comfortably at phone width"), since "log a book" is one of those five screens.

## Fix (2026-10-06)

New `Apollon/web/src/components/BookSubjects.tsx`: books with more than 10 subjects show the first 8 and a "Show all N" button, which turns into "Show fewer". Lists of 10 or fewer show in full, so there's never a "Show 1 more". On a phone, Dracula's (73 subjects) "Log this book" moved from about 2,500 px down to about 960 px. Tests in `BookSubjects.test.tsx`. The other suggestions (dropping catalogue codes like `nyt:…`, moving the buttons above the tags) weren't needed.
