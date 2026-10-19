# Audit — Author page (`/authors/:id`), baseline before the shelf refresh

Audited: 2026-10-16 · Apollon at `6df3601` · Evidence: source (`AuthorPage.tsx`, `AuthorReaders`, `AuthorQuotes`, `WritingCard`, `BookCard`, the follow and favourite buttons, `Layout.module.css`), screenshots and metrics from `scripts/shoot.mjs --metrics --shifts` on a production build (`vite preview`) at 375 and 1280, signed in and signed out. Not measured: INP (no interaction script), a real phone, Lighthouse. Design critique: `author-page.md`.

## Health score: 13/20 (acceptable)

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | Good names, focus and headings; the late buttons (3) and nothing else significant |
| 2 | Performance | 2 | Fast load (LCP ~0.2–0.3s, 310 KB, 115 requests, no long tasks), but CLS 0.20 on phones from the footer |
| 3 | Theming | 3 | Tokens throughout; the unstyled "Show more quotes" button ignores the themes |
| 4 | Responsive | 3 | No sideways scroll, 44px buttons; the phone header order and length |
| 5 | Implementation integrity | 2 | Five unstyled "Show more" buttons app-wide, four "more" styles here, a glyph icon |

**Integrity verdict: pass, with a systemic gap.** The page uses the shared pieces and tokens consistently within the old look; the gap is a missing shared "Show more" control (five copies, none styled) and no shared expander style.

**Update 2026-10-16 (Apollon edcbd41):** the three P2 findings are fixed (footer jump, shared `ShowMoreButton`, header button placeholders); performance and integrity would each score one point higher now. Re-score after the Phase 3 restyle.

## Summary

13/20. Issues: 3 P2, 4 P3. Top: the footer's layout shift on every page; the unstyled "Show more" buttons on five pages; the late header buttons. Next: fix the footer and the buttons now (small, shared, independent of the refresh); the rest lands with the refresh.

## Findings

- **[P2] Layout shift from the footer on every page.** `layout/Layout.module.css` (`.column`). Performance. CLS 0.20 at 375 / 0.04 at 1280 (production); the footer moves 436→211→0px while content loads. Core Web Vitals CLS < 0.1. Fix: `min-height: calc(100dvh - 5.5rem)` on `.column`. Pass: `optimize`.
- **[P2] Unstyled "Show more" buttons.** `AuthorQuotes.tsx:57`, `FeedPage.tsx:128`, `ReviewsPage.tsx:74`, `WritingsPage.tsx:74`, `FollowedAuthorsPage.tsx:95`. Theming / integrity. Browser default styling in every theme. Fix: a shared `ShowMoreButton`. Pass: `extract`.
- **[P2] Header buttons render late.** `AuthorFollowButton.tsx`, `AuthorFavouriteButton.tsx`. Performance / accessibility. Content shifts 24px under the reader's eye (WCAG 2.2 has no criterion; it's a CLS and focus-stability issue). Fix: render disabled placeholders of the same size while loading. Pass: `harden`.
- **[P3] Four "more" treatments, the quote's "More" misaligned.** `AuthorPage.tsx`, `WritingCard.tsx`. Integrity. Fix: one expander style aligned with its content. Pass: `polish`.
- **[P3] Gap rhythm around the links toggle.** `AuthorPage.module.css` `.textButton`. Responsive / integrity. Fix: padding instead of margin + min-height. Pass: `layout`.
- **[P3] Glyph icon "✓".** `BookCard.tsx:26`. Integrity (DESIGN.md No-Glyph Rule). Fix: the Phase 1 `Icon` set.
- **[P3] Phone header order** (years after the buttons). `AuthorPage.tsx`. Responsive. Fix: name → years → actions. Pass: `adapt`.

## Re-checked 2026-10-19

All seven are done, by the shelf refresh and the author page review (`author-page.md`): the page column has a minimum height (`Layout.module.css`, the footer no longer shifts); `ShowMoreButton` is used on every "Show more"/"Load more"; the follow and favourite buttons hold their place while loading (disabled, `aria-busy`); the expanders and the links toggle were redone in `author-page.md`; `BookCard` and its ✓ glyph are gone; the years sit under the name on a phone.

## Patterns

- **Missing shared controls breed copies:** "Show more" exists five times, unstyled each time; the expander ("Read more", "More", "Show all") exists in three styles. The `extract` pass should produce a `ShowMoreButton` and an expander text-button, and the refresh's Phase 1 shared pieces should include both.
- **Late-arriving personal state** (follow, favourite, read marks) is rendered as "nothing, then something" rather than a reserved placeholder. Worth one rule in DESIGN.md: personal state reserves its space while loading.

## What works

Covers and photos lazy-load and keep their aspect ratio; the page is small (310 KB) and fast; route code is split (`AuthorPage` 4 KB gzipped); all user text goes through `t()`; focus states and accessible names are good; sort and filter are in the address.

## Recommended passes

1. **[P2] `optimize`:** the footer's minimum height (shared, every page).
2. **[P2] `extract`:** `ShowMoreButton` and one expander style, used everywhere.
3. **[P2] `harden`:** placeholders for the header buttons while loading.
4. **[P3] `layout` / `adapt`:** the links toggle gap and the phone header order.
5. **`polish`** to finish. Re-run this audit after the Phase 3 restyle to compare.
