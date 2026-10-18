# Book descriptions show Open Library's Markdown as raw characters

**Priority:** P3 · **Size:** S · **Area:** Frontend, books · **Found:** 2026-10-16 (motion check of the book page restyle, `specs/shelf-design-refresh.md` Phase 3) · **Status:** Open

## What happens

Some Open Library descriptions are written in Markdown. The book page shows the marks as typed: Frankenstein (`/books/OL450063W`) starts "\*Frankenstein; or, The Modern Prometheus\* is an…", with the asterisks visible. Other books may show `[links](…)` or `----` rules the same way.

## Why

The description is plain text from Open Library, shown as is (`FoldedText`, `web/src/components/FoldedText.tsx`, splitting on blank lines). Nothing reads its Markdown. This predates the restyle.

## Suggested fix

Turn the few marks Open Library uses into text before showing it: `*x*` / `_x_` as emphasis, `[text](url)` as just the text (or a safe external link), and drop `----` rules and trailing source notes. Do it in the frontend (a small `lib/` helper with tests) and never with `dangerouslySetInnerHTML`. Check Frankenstein and a few classics afterwards.
