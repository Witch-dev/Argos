# Feature Spec — Font-size scale

**Status:** 📝 Spec drafted (2026-10-12), not yet implemented. Raised by `ux-reviews/community-feed.md` finding 11 (and noted in `design-tokens.md` since the 5-theme work).

## 1. Problem

Font sizes are chosen per component, as raw `rem` values. A count on 2026-10-12 across `Apollon/web/src`:

| Value | Uses | Typical use |
|---|---|---|
| 0.85rem | 120 | metadata, captions, small buttons |
| 0.9rem | 101 | secondary body text |
| 0.8rem | 68 | timestamps, counts |
| 0.75rem | 32 | badges, chips |
| 1.1rem | 26 | section headings, sidebar links |
| 1rem | 14 | |
| 1.05rem | 12 | card titles |
| 1.25rem / 1.6rem / 1.5rem | 9 / 8 / 6 | headings, big numbers |
| 0.95rem / 0.7rem / 1.15rem | 7 / 5 / 3 | |
| 0.65, 1.2, 1.35, 1.75, 2, 2.25rem | 1–2 each | one-offs |

**19 distinct sizes in 127 CSS files.** Between 12px and 17px alone there are eight steps less than 1px apart (0.75, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1rem), so the differences read as accidents instead of hierarchy, and every new component picks one more number.

## 2. Decisions to confirm before building

- **Number of steps: 7**, named by size not by role (`xs` to `2xl`), so a component can't be "wrong" about which role it plays. Fewer than 7 forces too many merges; more recreates the problem.
- **Merging moves a size by at most 0.05rem (0.8px).** No component changes by more than that, except the rare one-offs in the last row, which are looked at one by one.
- **`rem` stays**, so text still follows the reader's browser setting.
- **Tokens do not vary by theme**, so they live once in the bare `:root` block of `index.css`, not in the five theme blocks.
- **Headings stay in their own rules** (`h1`–`h4` in `index.css`); this scale is for component text.

## 3. The scale

| Token | Value | Replaces | Use |
|---|---|---|---|
| `--font-size-xs` | 0.75rem | 0.65, 0.7, 0.75 | badges, chips, counters |
| `--font-size-sm` | 0.85rem | 0.8, 0.85 | metadata, timestamps, captions |
| `--font-size-md` | 0.95rem | 0.9, 0.95 | secondary body text, form hints |
| `--font-size-base` | 1rem | 1, 1.05 | body, card titles |
| `--font-size-lg` | 1.15rem | 1.1, 1.15, 1.2, 1.25 | section headings, nav links |
| `--font-size-xl` | 1.5rem | 1.35, 1.5, 1.6, 1.75 | page and big-number text |
| `--font-size-2xl` | 2rem | 2, 2.25 | hero text (landing page) |

`--font-size-md` at 0.95rem makes the 101 uses of 0.9rem about 0.8px larger. If that looks heavier in dense lists (shelves, journal), the alternative is to merge 0.9 into `sm` (0.85rem); decide by looking at those two pages first.

## 4. Backend

None.

## 5. Frontend

### Phase 1: the tokens and a guard
- [ ] Add the seven tokens to the bare `:root` block of `web/src/index.css`.
- [ ] Update `.claude/skills/web-design/references/design-tokens.md` (Typography section: remove "no type-scale tokens exist yet") and the `web-design` skill's Phase 2 list (font sizes only from `--font-size-*`).
- [ ] A Vitest that reads every `*.module.css` and `index.css` and fails on a raw `font-size: <n>rem` outside an allowlist file. The allowlist starts as every file that still has one and only shrinks, so new code can't add a raw size while the migration is in progress.

### Phase 2: migrate in batches, with a look at each
Convert by area, one commit each, checking a screenshot of the area before and after (Paper and Dark, 1366 and 375px):
- [ ] Layout and shared: `layout/`, `StateMessage`, `BookCover`, `Avatar`, buttons and forms in `index.css`.
- [ ] Books: Books home, book page, shelves, journal, stats.
- [ ] Community: feed, writings, reviews, composer, modals.
- [ ] Lists, clubs, people.
- [ ] Settings, auth, legal, landing page (the `2xl` hero).
- [ ] Remove each file from the allowlist as it is done; the last batch empties it and the guard becomes absolute.

### Phase 3: review
- [ ] Run `ux-review` on one dense page (the journal) and one sparse page (the landing page) to confirm the hierarchy reads better, not just more uniform.

## 6. Verification
- [ ] `npm test`, `npm run lint`, `npm run build` clean after each batch.
- [ ] The guard test passes with an empty allowlist at the end.
- [ ] Browser: Paper, Dark and Sepia at 1366 and 375px for the pages in each batch; no text clipped, no layout jump in the cover rows or the header (their heights are coupled to font sizes in a few places, e.g. the 5.5rem header).
- [ ] Spot-check German (the longest strings) on the sidebar, the header tabs and a card with a long title.

## 7. Out of scope
- A line-height or spacing change (the space scale already exists).
- Changing the two font families.
- A user-facing "text size" setting; the browser's own zoom and font size already work because sizes are in `rem`.
