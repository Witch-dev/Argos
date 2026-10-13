# UX review — Story viewer (Readings strip)

Reviewed: 2026-10-12 · Themes: Paper · Widths: 1366×768, 375×700 · Reader: logged in, following alice_reads (4 stories: with a note and 4 comments, with progress and no note, two want-to-read) and the user's own stories (screenshots supplied by the user)
Screenshots looked at: stories 1–4 of one friend at both widths, the user's own story with a long comment thread, and a story with no comments. Card height measured on each step. Component: `StoryViewer.tsx`, `StoryViewer.module.css`; spec `specs/reading-stories.md` §3.4.

## Summary
The viewer's content is clear, but its frame is not stable: the card is 720px tall on one story and 586px on another, so the close button, segment bars and the whole card jump up and down while the ‹ › buttons stay put in the middle. The fix the user asked for is one fixed card size with the comments scrolling inside it, which also stops a long thread from pushing the cover and like button out of view. Two smaller things make the options harder to read than they need to be: the status label is a verb meant to follow a name (so a reader's own story says "You … IS READING"), and the ‹ › buttons float over the cover and note on a phone.

## Findings

### 1. The card changes height with its content, so the viewer jumps between stories — P2 · M · Rule
**Where:** `StoryViewer.module.css` `.card` (`max-height` only), `.body`.
**What:** measured at 1366×768, stepping through one friend's four stories: card height 720, 628, 586, 586px, and its top edge 24, 70, 91, 91px. The card is vertically centred, so its top and bottom both move, and the segment bars, the "×" and the ‹ › buttons (which stay at the middle of the screen) all shift between stories. The height depends on three things that vary: whether there is a progress bar, whether there is a note, and how many comments there are. A long thread (the first screenshot) makes the whole card scroll, so the cover and the like button scroll away with it. On a phone the card already fills the screen, so this is a wide-screen problem.
**Why it matters:** stepping through stories with ‹ › should keep everything but the story still. A frame that resizes makes each step feel like a new window, and the close button is never where the pointer was.
**Fix:** one fixed size for every story: `.card { height: min(44rem, calc(100dvh - 2 * var(--space-6))); display: flex; flex-direction: column; }`. Keep the segments, header, book block, progress, note and like button as a non-scrolling top part (`flex: 0 0 auto`), and put the comments in a region with `flex: 1; min-height: 0; overflow-y: auto`, so only the thread scrolls. Use the same width everywhere (it already is). Check the three states: no comments, long thread, and a long note (give the note a `max-height` with scroll, or clamp to 4 lines with "Show more", so it can't push the comments to nothing).
**Status:** fixed 2026-10-12 (fixed card height `min(44rem, 100dvh - 2 × --space-6)`, only the thread scrolls; measured 704px on all four stories)

### 2. The status label is a verb that only works after a name — P2 · S · Rule
**Where:** `StoryViewer.tsx` (`LOG_STATUS_LABELS[story.status]`), `lib/logStatus.ts`, `.status` in the CSS.
**What:** the label is "is reading" / "wants to read" (from `shelf.verb.*`), shown on its own line above the title in small uppercase. For your own story the header says "You" and the label says "IS READING", which reads "You is reading". On a friend's story it works only because the name is in the header, far above.
**Why it matters:** it reads as a grammar error on the reader's own stories, and the same label is spoken wrong in other languages whose verb forms depend on the subject.
**Fix:** show the shelf name instead of the verb: `t('shelf.status.' + story.status)` ("Reading", "Want to read", "Read", "Did not finish"), which already exists in all five languages. Keep the muted uppercase style.
**Status:** fixed 2026-10-12 (shows the shelf name, `shelf.status.*`)

### 3. The close button is a small text glyph — P2 · S · Rule
**Where:** `StoryViewer.module.css` `.close`.
**What:** a "×" character with `padding: 0 var(--space-1)`, about 20×24px.
**Why it matters:** it is the main way out on a phone, and it is under the 44px touch target the app uses (WCAG 2.2 minimum is 24px, which it only just meets).
**Fix:** give it a `2.75rem` square hit area (`min-width`/`min-height: 2.75rem`, centred), keep the glyph small. Do the same for the ‹ › buttons if they stay (they are 2.5rem, close to 44px; make them 2.75rem).
**Status:** fixed 2026-10-12 (44px hit area)

### 4. On a phone the ‹ › buttons float over the cover and the note — P2 · M · Rule
**Where:** `StoryViewer.module.css` `@media (max-width: 640px)` `.nav` (`position: fixed; top: 9rem`).
**What:** at 375px the two round buttons sit on top of the left edge of the cover and the right edge of the title and note text, and they have a shadow, so they cover part of the content they are meant to move past.
**Why it matters:** a control sitting on top of the content hides some of it, and the note text underneath can't be read at its edge.
**Fix:** on a phone, move the buttons out of the content: either into the header row beside "1 of 4" (‹ 1 of 4 ›), or a thin bar at the bottom of the card. Keep ← / → on desktop, where they sit outside the card.
**Status:** fixed 2026-10-12 (arrows sit in a reserved strip at the bottom of the card on a phone)

### 5. The last story's "›" closes the viewer, which the arrow does not say — P3 · S · Judgement
**Where:** `StoryViewer.tsx` (`isLast ? t('stories.closeAll') : t('stories.next')`).
**What:** on the very last story the button still shows "›" but its label is "Close stories", so pressing it closes the whole viewer. Sighted readers see an arrow, and the first story hides its "‹" completely (`visibility: hidden`).
**Why it matters:** a forward arrow that leaves is surprising, and the two ends of the row behave differently.
**Fix:** treat both ends the same: hide "›" on the last story (the ×, Escape and the backdrop already close it), or show a "Done" label there instead of the arrow.
**Status:** fixed 2026-10-12 (no forward arrow on the last story, like the first has no back arrow; `stories.closeAll` removed)

### 6. "Comments" is larger than the book title — P3 · S · Judgement
**Where:** `AnnotationCommentThread` heading inside the viewer (serif, about `--font-size-xl`) vs `.title` (`--font-size-lg`).
**What:** the section heading is the largest text in the card, bigger than the book it is about.
**Why it matters:** the eye goes to "Comments" first, though the book and the person's update are the point.
**Fix:** inside the viewer, set the thread heading to `--font-size-lg`, or `--font-size-base` bold. Keep it as is on the review and writing pages.
**Status:** fixed 2026-10-12 (thread heading at `--font-size-lg` inside the viewer)

### 7. The like control differs between your story and a friend's — P3 · S · Judgement
**Where:** `.ownLikes` vs `LikeButton`.
**What:** a friend's story shows a bordered button with an outline heart and a bare number ("♡ 0"); your own shows plain text "♥ 3 likes". Neither is wrong (you can't like your own story), but they look like different kinds of control.
**Why it matters:** low; the bare number on the button does not say "likes".
**Fix:** leave the behaviour; give both the same height and baseline so the row does not jump between your story and a friend's, which matters once the card has a fixed size (finding 1).
**Status:** fixed 2026-10-12 (same 2.5rem row height for the like button and the own-story count)

## Looked fine
- Focus moves into the dialog and back to the tile on close, Tab is trapped inside, Escape closes (and first leaves a comment draft), arrow keys do not steal the caret while typing.
- The segment bars show position and match the "n of N" text; the backdrop closes only on a press that starts and ends on it.
- The width is already fixed at every step (464px at 1366), so only the height needs the change in finding 1.
- Cover, title, progress bar and note stay readable at 375px, and the card fills the screen there with no horizontal scroll.
- Not checked: Dark, Sepia, German text length in the status label, and the arrows' hit area on a real touch device.
