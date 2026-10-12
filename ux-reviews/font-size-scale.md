# UX review — Font-size scale (journal and landing page)

Reviewed: 2026-10-12 · Themes: Paper, Dark · Widths: 375, 1366 · Reader: logged in with 11 journal entries (Read with and without a review, Did not finish, Currently reading, Want to read); landing page logged out
Screenshots looked at: Journal at 1366 (Paper, full page and first view) and 375 (Dark, full page); landing page at 1366 (Paper, first view) and 375 (Dark, full page). Compared against the pre-migration full-page screenshots taken for the Books and "settings, landing" batches (same pages, same data), by dimensions and by eye.

This is Phase 3 of `specs/font-size-scale.md`: the question is whether the hierarchy reads better, not whether it is more uniform.

## Summary
The migration did what it was meant to: the app now draws its text from 7 sizes (188 uses of `sm`, 108 of `md`, 40 `lg`, 37 `xs`, 26 `base`, 17 `xl`, 3 `2xl`), and neither page looks different at a glance. Hierarchy did not get better on its own, because the scale was built from the old values, and in two places it exposes where the hierarchy was already thin: the Journal's month headings are the same size as the entries beneath them, and `md` (0.95rem) sits only 0.8px under `base` (1rem). One real regression from the migration: the landing page's phone headings no longer step down.

## Findings

### 1. The journal's visibility select is 13.6px, so iOS zooms the page when it opens — P2 · S · Rule
**Where:** `ReadingVisibilitySelect.module.css` `.select` (`font-size: var(--font-size-sm)`), shown on every Journal entry
**What:** Safari on iPhone zooms the page when a form control under 16px takes focus. The `LanguageMenu` already knows this (its comment says so, and it is `--font-size-base`). The journal select is 0.85rem, and the same value shipped before the migration.
**Why it matters:** the most-used control on the Journal throws the reader into a zoomed page they then have to pinch back out of, on every change, on a phone.
**Fix:** `font-size: var(--font-size-base)` for the select at `max-width: 640px` (keep `sm` on desktop). Check `ReadingPrivacyBulk` and any other `select` that sets its own size.
**Status:** Fixed 2026-10-12 (Apollon 495e1d1): all selects are 16px on phones through one global rule in `index.css`, plus the journal select’s own size.

### 2. Landing page headings no longer step down on a phone — P3 · S · Judgement
**Where:** `LandingPage.module.css` (the `.featureHeading, .sectionHeading` block in the 640px media query), `LandingShowcase.module.css` (`.heading` in its media query)
**What:** these overrides existed to make section headings 1.35rem on a phone against 1.6rem on desktop. 1.35 and 1.6 both mapped to `xl` (1.5rem), so the override now sets the same value as the base rule and does nothing. Section headings are 2.4px larger on a phone than before. At 375px they still wrap onto two lines, so nothing breaks; what is lost is the deliberate step down from desktop, and two dead declarations are left in the CSS.
**Why it matters:** low. It is a small size change and some dead CSS, but a heading that was meant to be smaller on a phone is not, and the next reader of the file will assume the override does something.
**Fix:** either accept `xl` and delete the two dead overrides (recommended: the headings wrap cleanly at 375px), or step phones down to `--font-size-lg` (1.15rem, only 2.4px above body text, so probably too weak).
**Status:** Fixed 2026-10-12 (Apollon 495e1d1): the two dead overrides were deleted; headings are `xl` at every width.

### 3. Month headings in the Journal are the same size as the entries under them — P3 · S · Judgement
**Where:** `JournalList.module.css` `.monthHeading` (`--font-size-base`, `--text-muted`) against `.headline` / `.title` (`base`)
**What:** "October 2026" is 1rem muted serif with a hairline under it; the entry title beneath it is 1rem serif in full text colour. The only thing marking the level is colour and the rule. With the new tokens there is a free step: `lg`.
**Why it matters:** on a page of 30 entries over several months, the month is the only way to scan; at the moment the headings look like slightly dimmer entries.
**Fix:** `.monthHeading { font-size: var(--font-size-lg); }`, keeping `--text-muted` and the rule. The h2 is already serif by the base rule.
**Status:** Fixed 2026-10-12 (Apollon 495e1d1): `.monthHeading` is `--font-size-lg`.

### 4. A bordered "Public" select repeats on every entry and is as loud as the title — P3 · M · Judgement
**Where:** `JournalList.tsx:139` (`ReadingVisibilitySelect`), `ReadingVisibilitySelect.module.css`
**What:** each entry ends with a bordered box on `--bg`, 8 to 10 times down the page. Its box and label are heavier than the muted author and date lines above it, and on a phone it takes its own full row, which adds a row of about 40px to each entry.
**Why it matters:** the Journal is read far more often than a book's visibility is changed. The default is the same on nearly every row, so the control carries no information most of the time and competes with the title.
**Fix:** options, smallest first: (a) borderless until hover/focus, in `--text-muted`, with a caret; (b) show the setting as a small text label ("Public") that opens the select on tap; (c) hide it behind the existing `ReadingPrivacyBulk` and the entry's overflow menu. Needs a decision; (a) is one CSS rule.
**Status:** Fixed 2026-10-12 (Apollon 495e1d1), option (a) chosen: quiet at rest (no box, muted, aligned with the title), box on hover and focus. Only the compact journal row (`hideLabel`) is quiet; the log form’s select keeps its box.

### 5. `md` is 0.8px under `base`, so two steps of the scale read as one — P3 · M · Judgement
**Where:** `index.css` `--font-size-md: 0.95rem` and `--font-size-base: 1rem`; 108 and 26 uses
**What:** the middle of the scale is crowded: `xs` 12px, `sm` 13.6px, `md` 15.2px, `base` 16px, then clear steps to `lg` 18.4px, `xl` 24px, `2xl` 32px. Only `md` and `base` fall under the ~1px a reader can tell apart. In the Journal the note text is `md` and the entry title is `base`, and they look the same size. This is the "merge 0.9 into md" decision playing out: it kept a step that is not really a step.
**Why it matters:** the whole point of the scale was that differences read as hierarchy, not accidents. A pair 0.8px apart is the accident again, just with names.
**Fix:** decide by looking, then either fold `md` into `base` where it is body text and into `sm` where it is secondary (a codemod over 108 uses, one batch per area as before), or move `md` to 0.9rem so it sits visibly between `sm` and `base`. Raise it as a question before touching 108 declarations.
**Status:** Fixed 2026-10-12 (Apollon 7eed7cc), fold into `base` chosen: `--font-size-md` removed, 108 uses moved to `base`; the scale is six steps.

## Looked fine
- Landing page hero: one focal point (the headline), the lead at `lg` muted below it, and the Join button as the single filled accent control. Heading, lead and button read in that order at 1366 and 375.
- Landing page feature sections: heading `xl`, body `base`, demo cards `sm` and `xs`. Sizes recur; nothing in a demo card is louder than the heading.
- Journal entry internals at 1366 and 375: title serif italic, author and date `sm` muted, stars, then the review link; the 44px tap target for links is kept.
- Both pages in Dark: looked at by eye and read normally; no colour token was touched by the migration. Contrast ratios were not measured.
- Layout stability: page heights moved by 0 to 3px on the journal and by under 10px on the landing page in the before/after captures.
- Not checked: Sepia, 320px, German, and the empty and long-title states of the Journal.
