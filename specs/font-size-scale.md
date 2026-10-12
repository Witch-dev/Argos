# Feature Spec — Font-size scale

**Status:** ✅ Done 2026-10-12 apart from one decision: 419 of 420 raw sizes migrated, the scale is six steps after the Phase 3 review, and Sepia and German are checked. The 0.65rem list-cover badge stays raw and in the guard allowlist, so the "empty allowlist" box is not ticked.

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

- **Number of steps: 7 at first, 6 in the end** (see the note under the table), named by size not by role (`xs` to `2xl`), so a component can't be "wrong" about which role it plays. Fewer than 7 forces too many merges; more recreates the problem.
- **Merging moves a size by at most 0.05rem (0.8px).** No component changes by more than that, except the rare one-offs in the last row, which are looked at one by one.
- **`rem` stays**, so text still follows the reader's browser setting.
- **Tokens do not vary by theme**, so they live once in the bare `:root` block of `index.css`, not in the five theme blocks.
- **Headings stay in their own rules** (`h1`–`h4` in `index.css`); this scale is for component text.

## 3. The scale

| Token | Value | Replaces | Use |
|---|---|---|---|
| `--font-size-xs` | 0.75rem | 0.65, 0.7, 0.75 | badges, chips, counters |
| `--font-size-sm` | 0.85rem | 0.8, 0.85 | metadata, timestamps, captions |
| `--font-size-base` | 1rem | 0.9, 0.95, 1, 1.05 | body, secondary body text, form hints, card titles |
| `--font-size-lg` | 1.15rem | 1.1, 1.15, 1.2, 1.25 | section headings, nav links |
| `--font-size-xl` | 1.5rem | 1.35, 1.5, 1.6, 1.75 | page and big-number text |
| `--font-size-2xl` | 2rem | 2, 2.25 | hero text (landing page) |

**Decided 2026-10-12, in two steps.** The 0.9rem uses first went to `md` (0.95rem). The Phase 3 review then showed `md` sat 0.8px under `base` and read as the same size, so `md` was removed and its 108 uses folded into `base`. The scale is **six** steps, each at least 1.6px apart.

## 4. Backend

None.

## 5. Frontend

### Phase 1: the tokens and a guard
- [x] Add the seven tokens to the bare `:root` block of `web/src/index.css`.
- [x] Update `.claude/skills/web-design/references/design-tokens.md` (Typography section: remove "no type-scale tokens exist yet") and the `web-design` skill's Phase 2 list (font sizes only from `--font-size-*`).
- [x] A Vitest that reads every `*.module.css` and `index.css` and fails on a raw `font-size: <n>rem` outside an allowlist file. The allowlist starts as every file that still has one and only shrinks, so new code can't add a raw size while the migration is in progress. *(Built as `web/src/styles/fontSizeScale.test.ts` + `fontSizeAllowlist.ts`: the allowlist maps each file to how many raw sizes it may keep (127 files, 420 sizes), and the test also fails on a stale entry, so a converted file's line must be deleted.)*

### Phase 2: migrate in batches, with a look at each
Convert by area, one commit each, checking a screenshot of the area before and after (Paper and Dark, 1366 and 375px):
- [x] Layout and shared: `layout/`, `StateMessage`, `BookCover`, `Avatar`, buttons and forms in `index.css`. *(Done 2026-10-12, Apollon 308de39: 9 files, 17 sizes. `StateMessage` and `index.css` had no raw sizes. Checked logged out in Paper and Dark at 1366 and 375px: page heights identical before/after. The logged-in sidebar, section switch and book covers were not rendered.)*
- [x] Books: Books home, book page, shelves, journal, stats. *(Done 2026-10-12, Apollon 12df207: 28 files, 81 sizes. `BookReviewsSection` and `ReviewFilterBar` left for the Community batch. Rendered logged in at 1366 and 375px, Paper and Dark, before/after: no clipping, page heights moved 1-8px. The phone star picker goes 36px to 32px. Stats had no data in the test reader, so only its empty state was seen.)*
- [x] Community: feed, writings, reviews, composer, modals. *(Done 2026-10-12, Apollon 1437856: 28 files, 93 sizes, plus the two journal privacy controls missed in batch 2. Rendered logged in with a followed reader's posts: feed, writings, reviews, news, review and writing detail, Paper and Dark, 1366 and 375px, before/after. No clipping, heights moved 4-20px. The composer modal was not opened.)*
- [x] Lists, clubs, people. *(Done 2026-10-12, Apollon 9da2ff7: 37 files, 141 sizes. One size kept raw on purpose: the 0.65rem status badge on a list cover in `ListDetailPage`, a nowrap label that 0.75rem would overflow; it stays in the allowlist. Rendered logged in: lists, list detail, clubs, a club, people, profile and compare, Paper and Dark, 1366 and 375px, before/after. No clipping; 375px pages got 14-130px shorter, the list detail 54px taller. Found, already present before this batch: the other reader's profile and the compare page are 386px wide at 375px, a horizontal overflow.)*
- [x] Settings, auth, legal, landing page. *(Done 2026-10-12, Apollon e11c3d6: 25 files, 87 sizes, including notifications, import dialogs and the shared leftovers no batch named. The landing page has no `2xl` hero: its two big headings are fluid `clamp()` sizes, left as they are. Rendered landing, login, register, privacy, terms, settings, notifications, import and delete-account, Paper and Dark, 1366 and 375px, before/after: no clipping, heights moved 0-52px. The import dialogs were not opened.)*
- [x] Remove each file from the allowlist as it is done; the last batch empties it and the guard becomes absolute. *(One entry remains on purpose: `ListDetailPage` keeps its 0.65rem cover badge. The guard now also rejects raw `px` and `em`.)*

### Phase 3: review
- [x] Run `ux-review` on one dense page (the journal) and one sparse page (the landing page) to confirm the hierarchy reads better, not just more uniform. *(Done 2026-10-12, `ux-reviews/font-size-scale.md`: 5 findings, all open. Verdict: the pages look as they did and the scale is in place, but the hierarchy is not better by itself. Two real follow-ups: the iOS-zoom select on the Journal (P2) and `md` being 0.8px under `base`.)*

## 6. Verification
- [x] `npm test`, `npm run lint`, `npm run build` clean after each batch. *(Every batch: 675 tests, lint and build clean.)*
- [ ] The guard test passes with an empty allowlist at the end. *(Not as written: one entry stays, the 0.65rem list-cover badge, by decision. Either accept that and tick this, or give the badge a token-sized fix.)*
- [x] Browser: Paper, Dark and Sepia at 1366 and 375px for the pages in each batch; no text clipped, no layout jump in the cover rows or the header (their heights are coupled to font sizes in a few places, e.g. the 5.5rem header). *(Paper and Dark in every batch; Sepia on 10 logged-in pages at both widths on 2026-10-12: no horizontal overflow and no clipped text found by script, club page looked at.)*
- [x] Spot-check German (the longest strings) on the sidebar, the header tabs and a card with a long title. *(2026-10-12, account language switched to German: the same 10 pages at 1366 and 375px. Sidebar, header tabs and the long list and book titles are fine. One real overflow found and fixed: the profile stats row at 375px ("Durchschnittsbewertung"), Apollon f0cf46a. The profile tab row wraps to two lines in German, as designed. Left alone: the German placeholder of the club invite field is cut off at 375px.)*

## 7. Out of scope
- A line-height or spacing change (the space scale already exists).
- Changing the two font families.
- A user-facing "text size" setting; the browser's own zoom and font size already work because sizes are in `rem`.
