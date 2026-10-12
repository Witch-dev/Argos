# UX review: Community feed (`/feed`)

Reviewed: 2026-10-11 · Themes: Paper, Dark · Widths: 1366 (desktop), 900 (tablet), 375 (phone) · Readers: one following four readers who have reviews, notes, a titled writing, a quote and activity; one new reader following one
Looked at: the feed at all three widths and in Dark, the four filters, the new-reader state down to "Readers to follow", the composer (desktop dialog and phone sheet), the writing modal, a 60-stop keyboard pass, and target sizes, font sizes and accessible names measured in the page.
Code read: `FeedPage.tsx`, `FeedItemCard.tsx`, `WritingCard.tsx` (+ css), `FeedSocialBar.tsx`, `SectionsLayout.tsx`, `ComposerPrompt.tsx`, `WritingDetailModal` close button, `RightPanel` cards.
The header and sidebar were reviewed with `ux-reviews/books-home.md` and are not repeated here.

## Summary

The feed's structure works: filters live in the URL, Escape closes the composer and the modal and returns to the same filtered page, spoilers are gated, the keyboard ring is always visible and there is a "You're all caught up" end. What costs it is **proportion and repetition**. A writing about a book opens with a 710×710 image block that pushes its text below the fold, a long review is printed in full while writings are clamped, and "Feed / Writings / Reviews" appears three times on one screen with two different meanings. The small actions that make it social (like, comment) are 22×18px and drawn with an emoji that ignores the theme.

Count: 0 × P1, 5 × P2, 7 × P3. Quick wins (S): 1, 3, 5, 6, 7, 8, 9, 10, 12.

**11 of 12 fixed on 2026-10-11** (Apollon `40fdd84`) and re-checked in a browser at 1366, 900 and 375px, in Paper and Dark, with the composer and writing modal. Open: finding 11 (a font-size scale), which is a cross-page job. Smaller things noticed while verifying and left alone: "Show anyway" is 17px tall, a review row's cover link and its title link are two tab stops to the same page, and "More" on a writing whose cut lands on a blank line shows a lone "…" above it.

## Findings

### 1. Like, comment and the small text actions are below the minimum target size: P2 · S · Rule
**Where:** `FeedSocialBar.tsx:58-69` (and its CSS), `WritingCard.tsx` ("… more"), `ActivityGroupCard` ("Show all N"), `FeedItemCard.tsx` ("Open review"), `WritingDetailModal` close button.
**What:** measured at 1366 and at 375: "Like" is 22×18, "N comments" 30×18, "Show all 2" 62×15, "Open review" 78×16, "… more" 56×19, and the modal's × is a 1.5rem glyph with 4px of padding. Only the filter chips grow to 44px on a phone. WCAG 2.2 requires at least 24×24, and these are the feed's main actions.
**Why it matters:** liking is the cheapest way to take part, and on a thumb the 22×18 heart sits next to a 30×18 comment link and misses often.
**Fix:** keep the glyphs small but give each control a hit area of at least 44px on a phone and 24px on desktop (padding with a matching negative margin, or `min-height: 2.75rem` under 640px like the chips). Same treatment for "Show all", "Open review", "… more" and the modal close.
**Status:** Fixed (Apollon 40fdd84): like, comments, "Show all" and "Open review" are at least 24px tall on desktop, and the like and comment controls have a 44px hit area on a phone; the modal's × is a 44px button. Correction to the finding above: the like button already had an invisible phone hit area (about 38×42), so the 22×18 I measured there was its drawn box; the comment link had none.

### 2. A writing about a book leads with a 710px-tall image block: P2 · M · Judgement
**Where:** `WritingCard.module.css` `.imageSlot`; used by `FeedItemCard.tsx` for every writing that has a book.
**What:** the book cover is enlarged to the full column width inside a square slot (710×710 at desktop, 328 wide at phone) with a blurred copy of the cover behind it. One note about *Pride and Prejudice* takes about 900px of scroll, and its title and text start below the fold. The same cover is also a small thumbnail on the matching review row two items down.
**Why it matters:** the feed is meant to be scanned. A single writing hides the next three items, and an upscaled cover pretending to be an image tells the reader nothing the 56px thumbnail doesn't (a real image upload is still a future idea in `FUTURE-IDEAS.md`).
**Fix:** when the image is only the book's cover, show it as a small thumbnail beside the text, as review rows do, and keep the full-width slot for real images. If the slot stays, cap its height (a 16:9 box, `max-height` about 16rem).
**Status:** Fixed (Apollon 40fdd84), as decided with the user: the book cover is a 4.5rem thumbnail beside the text, so the title and text lead and a writing is about 200px tall instead of 900px. The square slot stays out of the card until real image upload exists.

### 3. Long reviews are printed in full, writings are clamped: P2 · S · Judgement
**Where:** `FeedItemCard.tsx` review branch (`.review`, `white-space: pre-wrap`, no clamp).
**What:** a 7-paragraph review fills about 700px of the feed, whereas a writing is cut at 4 to 6 lines with "… more". The "Open review" link sits under the full text, where nobody who has read it needs it.
**Fix:** clamp review text to about 6 lines (same mechanism as `WritingCard`), keep "Open review" as the way to the rest, and keep the spoiler gate in front of it.
**Status:** Fixed (Apollon 40fdd84): reviews are cut at six lines in the feed, "Open review" has the rest.

### 4. "Feed / Writings / Reviews" appears three times with two meanings: P2 · M · Judgement
**Where:** the sidebar (Feed, Reviews, Writings), the tab row under the Readings strip (`SectionTabs.tsx`: Feed, Writings, Reviews, which are separate pages) and the chips (All, Reviews, Writings, Activity, which filter this page).
**What:** the same two words are a page link in two places and a filter in a third, in different orders, within one screen. "Writings" in the tab row leaves the feed; "Writings" in the chips stays on it.
**Why it matters:** a reader who wants only reviews can click any of three things and get different results.
**Fix:** drop one of the page-level sets (the sidebar already lists them), or fold them into one control. If both stay, order them the same way and word the chips as a filter ("Show: All · Reviews · Writings · Activity", which the group already announces as "Show in the feed").
**Status:** Fixed (Apollon 40fdd84), option 1 as decided with the user: the sidebar lists Feed, People, Clubs and News; Reviews and Writings are the other two tabs of the Feed section. The chips were not relabelled.

### 5. The like and comment icons ignore the theme: P2 · S · Rule
**Where:** `FeedSocialBar.tsx:17-18, 58-69`: `♥` / `♡` text glyphs and a `💬` emoji.
**What:** the comment bubble is a pale lavender emoji on the Paper background (about 1.3:1) and plain white in Dark; the heart is a text character that changes size and weight with the font. The accessible link name is "0 comments" but its text content is `💬 0`.
**Fix:** use small SVG icons with `currentColor`, like `NavIcons.tsx`, in `--text-muted` and `--accent` for a liked state.
**Status:** Fixed (Apollon 40fdd84): SVG heart and comment icons in `currentColor` (`SocialIcons.tsx`), also used by every `LikeButton` (lists, reviews, stories).

### 6. Clamped text shows two ellipses: P3 · S · Rule
**Where:** `WritingCard.tsx:101-108`, `writings.more` ("… more") under a `-webkit-line-clamp` block.
**What:** when the cut falls on a blank line, the clamp prints its own "…" on a line by itself and the button then says "… more", which reads as "…, … more".
**Fix:** label the button "More" / "Show more" (all five languages), and let the clamp supply the ellipsis.
**Status:** Fixed (Apollon 40fdd84): the button says "More" (all five languages). When the cut falls on a blank line the clamp's own "…" still sits on its own line above it.

### 7. One writing has four tab stops that all do the same thing: P3 · S · Rule
**Where:** `WritingCard.tsx`: the image button, the title button, the text button and "… more" all open the modal.
**What:** in the 60-stop keyboard pass, one titled writing took four stops (the image at 710×710, the title, "… more", and for notes the whole text as a button), each announced differently.
**Fix:** make the title the one stop, like the journal's cover (`tabIndex={-1}` and `aria-hidden` on the image button), and keep "… more" for the clamped text only.
**Status:** Fixed (Apollon 40fdd84): the thumbnail and "More" are mouse-only duplicates (`tabIndex=-1`, `aria-hidden`); the title, or a note's text, is the one stop. Keyboard pass: a titled writing is now title, like, comments.

### 8. The visible "Feed" title is a link and the real h1 comes after an h2: P3 · S · Rule
**Where:** `SectionsLayout.tsx`, `FeedPage.tsx:87`.
**What:** the large serif "Feed" is the active tab link; the real `<h1>` is visually hidden and comes after the Readings strip's `<h2>`, so the heading outline starts with a level 2.
**Fix:** render the hidden `<h1>` before the strip (in `SectionsLayout` or at the top of each tab page's wrapper).
**Status:** Fixed (Apollon 40fdd84): the hidden `<h1>` lives in `SectionsLayout` before the strip; the three pages no longer render their own.

### 9. The right rail's headings and links do not match each other: P3 · S · Judgement
**Where:** `MyClubsCard.module.css` (`.heading`: muted, 0.95rem) vs `RightPanel.module.css` (`.heading`: 1rem, text colour); "Browse clubs to join" is an accent link, "Browse lists" a muted one.
**What:** "My Book Clubs" is grey and "Lists" is dark; one link is terracotta, the other grey. They are siblings in one column.
**Fix:** one heading style and one link style for rail cards, and name the Lists card for what it does ("Browse lists" as the link under a "Lists" heading says the same thing twice).
**Status:** Fixed (Apollon 40fdd84): both rail headings are 1rem in the text colour, and "Browse lists" uses the same accent link as "Browse clubs to join".

### 10. The composer relies on placeholders for labels, and its prompt is cut off on a phone: P3 · S · Rule
**Where:** `WritingComposerModal` ("About a book? (optional)"), `ComposerPrompt.tsx`.
**What:** the book field has no visible label, only a placeholder that disappears as soon as there is text. On a 375px screen the prompt reads "What are you reading or thinkin…".
**Fix:** a visible small label (or an icon-and-label row) for the book field; shorten the phone prompt ("What's on your mind?"), or let it wrap to two lines.
**Status:** Fixed (Apollon 40fdd84): the book fields have a visible label above the search box (a `label` prop on `BookPicker`), the typed-source field has an accessible name, and the feed prompt wraps instead of cutting.

### 11. Eight font sizes between 12 and 17px: P3 · M · Judgement
**Where:** across the feed and shared components: 12, 12.8, 13.6, 14.4, 15.2, 16 and 16.8px, plus an 11.2px badge. They are picked per component (`0.75rem`, `0.8rem`, `0.85rem`, `0.9rem`, `0.95rem`, `1.05rem`, ...).
**What:** the steps are less than 1px apart, so the differences read as accidents, not hierarchy. This is the same pattern noted in `design-tokens.md` ("no type-scale tokens exist yet").
**Fix:** a cross-page decision, not a one-off: add 4 or 5 `--font-size-*` tokens (small, body, large, title, heading) and move components onto them as pages are touched. Raise it as its own piece of work.
**Status:** open

### 12. On a phone the activity line breaks before "minutes ago": P3 · S · Judgement
**Where:** `ActivityGroupCard`: "ux_c_dee_893440 finished 2 books 2 / minutes ago".
**What:** the time is part of the same inline run, so it wraps mid-phrase and leaves the number on one line and the unit on the next.
**Fix:** keep the time in a `white-space: nowrap` span, or put it on its own line under 640px.
**Status:** Fixed (Apollon 40fdd84): the time stays on one line (`white-space: nowrap`), in the activity row and in the writing card's author line, which wraps as a whole instead.

## Looked fine

- **Keyboard:** a 2px ring on all 60 stops, a skip link, an order that goes header, sidebar, strip, tabs, composer, chips, items. The chip group is announced as "Show in the feed" with `aria-pressed`.
- **State and recovery:** the filter lives in `?filter=`; Escape closes the composer and the writing modal and lands back on the same filtered URL; the modal is labelled with the writing's title and focus moves into it; the composer focuses its textarea.
- **Content:** spoiler reviews are gated with "Show anyway"; long usernames (30 characters) fit the headline; the strip's names truncate with an ellipsis; "You're all caught up" ends a full feed; a new reader gets "Readers to follow" at the end.
- **Phone:** no horizontal scroll at 375px; chips grow to 44px; the composer becomes a bottom sheet with Cancel and Post at the top.
- **Dark:** same layout and contrast as Paper apart from finding 5.

## Not verified

- Not covered: the comment thread view, partial (inline) spoilers, the expanded "Show all N" activity row, Sepia, German text lengths, and the Reviews and Writings pages themselves.
- The Community strip's friend tiles were checked for names only; the story viewer was not.
