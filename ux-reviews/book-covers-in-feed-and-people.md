# UX review — Book covers in the feed's activity group and the People reader card

Reviewed: 2026-10-14 · Themes: Paper, Dark · Widths: 375, 1280 · Reader: logged in, follows readers with and without covers
Screenshots looked at: `/feed` (grouped "started N books" row, 1280 Paper and Dark, 375 Paper), `/people` "New readers" (1280 Paper and Dark), with covered and no-cover books, a 23-character title.

## Summary
Bigger covers (3.5rem in the feed group, 2.5rem on the reader card) read well, and a reader card without a cover now lines up cleanly. The no-cover placeholder was the weak spot: at the new size it broke short words mid-word and underlined the title. Both are fixed in the working tree (uncommitted in Apollon).

## Findings
### 1. Placeholder broke short words mid-word ("White Night / s") — P2 · S · Rule
**Where:** `BookCover.module.css` `.placeholder`, in the 3.5rem slot of `ActivityGroupCard`
**What:** `--space-2` padding left about 38px of text width and `overflow-wrap: anywhere` split "Nights" and "White" after a letter or two.
**Why it matters:** the title is the only thing identifying the book, and it read as a typo.
**Fix:** padding `--space-1`, `overflow-wrap: break-word` (breaks only a word that can't fit on its own line).
**Status:** fixed (not yet committed)

### 2. No-cover title underlined as a link — P3 · S · Judgement
**Where:** `ActivityGroupCard.module.css` `.cover` (a `Link`)
**What:** the placeholder text inherited the link underline, so it looked like a stray hyperlink next to the real title link.
**Fix:** `text-decoration: none` on `.cover`.
**Status:** fixed (not yet committed)

### 3. A long title still loses its last line in a 3.5rem placeholder — P3 · S · Judgement
**Where:** `BookCover` placeholder, ~5 lines fit in the 2:3 box
**What:** "The death of Iván Ilých" fits in 4 lines now; a 6+ word title would be clipped. The full title stays in the `aria-label` and in the "started N books" detail, so nothing is lost for a screen reader, but a sighted reader sees a cut-off title.
**Fix:** acceptable for now; if it bothers, show the title in the row below the covers or widen to 4rem.
**Status:** open

## Looked fine
Reader card row without a cover (no empty gap, text aligned under the name), 2.5rem cover on the reader card, covers in Dark, and the 375px feed (no horizontal scroll). Contrast of the placeholder text (`--text-muted` on `--bg-elevated`) in Paper and Dark.
