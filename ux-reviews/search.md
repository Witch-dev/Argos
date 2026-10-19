# UX review — Search (`/search`)

Reviewed: 2026-10-18 · Themes: all five (Paper, Dark at both widths; the rest on contact sheets) · Widths: 375, 1280 · Reader: logged in, interface in English · Apollon at `be32e1c`
Screenshots looked at: "tolkien" (results) and "the" (no results in English) at the top and 700px down, 1280 and 375. Not captured: the Authors tab, pick mode, the header suggestions open (checked when built, Phase 3).
Code read: `SearchPage.tsx`, `HeaderSearch.tsx`.

## Summary

A clean Operate screen: one field, Books | Authors, three labelled filters, results on a shelf. The one real problem is behind it: searching a common word in your own language can come back empty and blame your languages (filed as a bug). On a phone the page shows two search fields one above the other.

## Scores

**Nielsen: 28/40 (good).** Scored 2: error recovery (9: "Nothing in your languages for "the"" when the cause is the query, finding 1), help (10). Cognitive load: low (0 failed). Personas: Riya (first-timer) types a short query and is told her language has nothing. Alex (phone) sees "tolkien" in the header and again in the page's field. Specificity: passes (results on a shelf).

## Findings

### 1. A common word in "My languages" finds nothing and blames the languages — P3 · S · Rule
Filed: `bugs/search-common-word-in-language-finds-nothing.md`.
**Status:** fixed 2026-10-18: for a lone word of three letters or fewer the empty message asks for more words instead of blaming the languages (the Open Library limit stays; see the bug file).

### 2. Two search fields on a phone — P3 · M · Judgement
**Where:** `SearchPage.tsx` field and the header's `HeaderSearch`; "375": both say "tolkien", 160px apart. (Noted as a follow-up when the page was built.)
**Fix:** on `/search` below 640px, hide the page's field and let the header field drive the page (it already shows the query), or hide the header field on this page only; keep both on desktop where they're far apart.
**Status:** fixed 2026-10-18: below 640px the page's field is left out for books (the header's holds the query); Authors and pick mode keep it.

### Shared
Books | Authors pills: `shell-and-shared-pieces.md` #2. The placeholder's two dots: shared #6.

## Looked fine

The title, field and pills in one column; Sort / Published / Language as labelled 44px fields (two to a row on a phone so the books start on the first screen); results as a grid shelf with authors and year; "Search all languages" offered as the next step; all five themes.
